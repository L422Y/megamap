import { MegaMap, MegaMapOptions } from "./MegaMap"

import { shallowReactive, shallowRef, ShallowRef, triggerRef } from "vue"

export function useReactiveMegaMap<K extends string, V extends Record<string, any>>(opts: MegaMapOptions<K, V>) {
  return new ReactiveMegaMap<K, V>(opts)
}

/**
 * A `MegaMap` that publishes its changes through Vue shallow refs and explicit
 * `triggerRef()` calls, rather than by wrapping the record store in a deep
 * `reactive()` proxy.
 *
 * Records are stored as-is — they are never proxied — so object identity is
 * preserved (`map.value[key] === theObjectYouPassedIn`) and Vue does no deep
 * traversal. The trade-off is that mutating a record in place is invisible to
 * Vue: either `set()` the record again, or call `touch(key)`.
 *
 * Three levels of granularity are available:
 *
 * - `itemRef(key)` — a stable ref for one record. Fires only when that record
 *   is set, touched, replaced by a reload, or deleted. This is the granular
 *   subscription; prefer it for per-record components.
 * - `subLists.<name>` — one array per `subListFilters` entry. The array is
 *   replaced (and therefore fires) only when that list's membership or
 *   contents actually change, so updating a draft does not notify watchers of
 *   the published list.
 * - `value` / `mapRef` — the whole record store. Fires on any content change.
 *   Iterating this is the coarse option by design; reach for `itemRef` or a
 *   sub-list when you want fewer notifications.
 */
export class ReactiveMegaMap<K, V extends Record<string, any>> extends MegaMap<K, V> {
  readonly [Symbol.toStringTag]: string = "ReactiveMegaMap"

  /**
   * Collection-level ref. Its `.value` is the *same* object as `this._map`, so
   * it is driven by `triggerRef()` rather than by reassignment — except in
   * `clear()`, where the base class swaps in a fresh record store.
   *
   * Declared with `declare` on purpose: property initializers of this class run
   * after `MegaMap`'s constructor (and therefore after `init()`), so an
   * initializer here would overwrite whatever `init()` set up.
   */
  declare protected _mapRef: ShallowRef<Record<string, V>>

  /** Lazily created per-record refs, keyed the same way as the record store. */
  declare protected _itemRefs: Map<string, ShallowRef<V | undefined>>

  declare _subLists: Record<string, V[]>

  /**
   * Makes `isLoading` / `hasLoadedOnce` observable at the point the base class
   * creates them, so no state is lost to a later reassignment. They hold only
   * scalars, so a shallow proxy is enough.
   * @param obj
   * @protected
   */
  protected override _reactiveState<T extends object>(obj: T): T {
    return shallowReactive(obj) as T
  }

  /**
   * The record store, read through the collection ref so that reads inside a
   * computed/effect register a dependency.
   */
  override get value(): Record<string, V> {
    return this._mapRef.value
  }

  /**
   * The collection-level ref itself, for `watch()`ing the map as a whole.
   */
  get mapRef(): ShallowRef<Record<string, V>> {
    return this._mapRef
  }

  override get subLists(): Record<string, V[]> {
    return this._subLists
  }

  override set subLists(value: Record<string, V[]>) {
    this._subLists = value
  }

  /**
   * Note: this deliberately does not call `super.init()`. `MegaMap.init()`
   * would reset `_subLists` to a plain object, undoing the reactive container
   * set up here; the `loadAll` kickoff it performs is reproduced below instead.
   */
  async init(opts: MegaMapOptions<string, V>) {
    this._mapRef = shallowRef(this._map)
    this._itemRefs = new Map()
    // The type argument is required: inferring it from `{}` resolves to
    // `ShallowReactive<{}>`, which drops the index signature.
    this._subLists = shallowReactive<Record<string, V[]>>({})

    for (const filterKey in this._subListFilters) {
      this._subLists[filterKey] = []
    }

    if (opts.loadAll) {
      this.getAll().catch((err) => {
        console.error(err)
      })
    }
  }

  /**
   * Returns a stable ref for a single record, creating it on first use. The ref
   * fires only for changes to that key, and can safely be requested before the
   * record exists (it will hold `undefined` until the record loads).
   *
   * Refs are retained for the lifetime of the map, including across `delete()`
   * and `clear()`, so a consumer holding one keeps receiving updates if the key
   * comes back.
   * @param key
   */
  public itemRef(key: string): ShallowRef<V | undefined> {
    let ref = this._itemRefs.get(key)
    if (!ref) {
      ref = shallowRef(this._map[key])
      this._itemRefs.set(key, ref)
    }
    return ref
  }

  /**
   * Announces that a record was mutated in place. Fires that record's ref, the
   * collection ref, and any sub-list whose contents changed as a result.
   * @param key
   */
  public touch(key: string): void {
    const ref = this._itemRefs.get(key)
    if (ref) {
      ReactiveMegaMap.publish(ref, this._map[key])
    }
    triggerRef(this._mapRef)
    this.updateSubLists()
    this.emit("updated")
  }

  public override set(key: string, value: V): this {
    if (value === undefined) {
      return this
    }

    // `super.set()` runs `notifyMapUpdated()`, which drives the sub-lists.
    super.set(key, value)

    const ref = this._itemRefs.get(key)
    if (ref) {
      ReactiveMegaMap.publish(ref, value)
    }
    triggerRef(this._mapRef)
    return this
  }

  public override delete(key: string): boolean {
    const existed = super.delete(key)
    if (existed) {
      const ref = this._itemRefs.get(key)
      if (ref) {
        ref.value = undefined
      }
      triggerRef(this._mapRef)
    }
    return existed
  }

  public override clear(): void {
    // `LoadableMap.clear()` swaps in a fresh record store, so the collection
    // ref has to be repointed at it.
    super.clear()
    this._itemRefs.forEach((ref) => {
      ref.value = undefined
    })
    this._mapRef.value = this._map
    this.updateSubLists()
  }

  public override async getAll(refresh?: boolean): Promise<Record<string, V>> {
    const result = await super.getAll(refresh)
    this.syncFromMap()
    return result
  }

  public override async forceRefresh(): Promise<void> {
    await super.forceRefresh()
    this.syncFromMap()
  }

  /**
   * Recomputes the sub-lists, replacing a list only when its contents actually
   * changed so that unaffected lists do not notify their watchers.
   */
  override updateSubLists() {
    if (!this._subLists) {
      return
    }
    const values = Object.values(this._map)
    for (const [filterKey, filter] of Object.entries(this._subListFilters)) {
      const next = values.filter(filter)
      if (!ReactiveMegaMap.sameList(this._subLists[filterKey], next)) {
        this._subLists[filterKey] = next
      }
    }
  }

  /**
   * Reconciles the refs with the record store after a bulk load, which writes
   * to the store directly instead of going through `set()`. Item refs are
   * assigned rather than force-triggered, so only records whose identity
   * actually changed notify.
   * @protected
   */
  protected syncFromMap(): void {
    this._mapRef.value = this._map
    this._itemRefs.forEach((ref, key) => {
      ref.value = this._map[key]
    })
    triggerRef(this._mapRef)
    this.updateSubLists()
  }

  /**
   * Notifies a record ref exactly once. Assigning a different record already
   * notifies on its own; `triggerRef` is only needed when the record object is
   * unchanged, i.e. it was mutated in place.
   * @param ref
   * @param value
   * @private
   */
  private static publish<T>(ref: ShallowRef<T | undefined>, value: T | undefined): void {
    const previous = ref.value
    ref.value = value
    if (previous === value) {
      triggerRef(ref)
    }
  }

  private static sameList<T>(a: T[] | undefined, b: T[]): boolean {
    if (!a || a.length !== b.length) {
      return false
    }
    for (let i = 0; i < b.length; i++) {
      if (a[i] !== b[i]) {
        return false
      }
    }
    return true
  }
}
