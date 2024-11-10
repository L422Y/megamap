import { CachedLoadableMap, CachedLoadableMapOptions } from "./CachedLoadableMap"

import Fuse from "fuse.js"
import { MaybeRef } from "vue"

export type MegaMapOptions<K extends string, V> = {
  loadOne: (key: string) => Promise<V | undefined>
  loadAll?: () => Promise<Record<string, V> | V[]>
  expiryInterval?: number, keyProperty?: string
  secondaryMaps?: Array<MegaMap<any, any>>
  filter?: (item: V) => boolean
  sort?: (item1: V, item2: V) => number
  searchableFields?: string[]
  subListFilters?: Record<string, (item: V) => boolean>; onUpdated?: () => void
  reactive?: boolean
} & CachedLoadableMapOptions<K, V>


export function useMegaMap<K extends string, V extends Record<string, any>>(opts: MegaMapOptions<K, V>) {
  return new MegaMap<K, V>(opts)
}

export class MegaMap<K, V extends Record<string, any>> extends CachedLoadableMap<string, V> {
  [Symbol.toStringTag]: string = "MegaMap"
  public readonly version = 2
  _subListFilters: Record<string, (item: V) => boolean>
  private secondaryMaps: Array<MegaMap<string, V>> = []
  private _filter?: (item: V) => boolean
  private _sort?: (item1: V, item2: V) => number
  private readonly _searchableFields: string[]

  constructor(opts: MegaMapOptions<string, V>) {
    super(opts)
    this.secondaryMaps = opts.secondaryMaps || []
    this._filter = opts.filter
    this._sort = opts.sort
    this._searchableFields = opts.searchableFields ?? []
    this._subListFilters = opts.subListFilters || {}
    if (opts.onUpdated) {
      this.on("updated", opts.onUpdated)
    }
    this.init.bind(this)(opts).catch((err) => {
      console.error(err)
    })
  }

  _subLists: MaybeRef<Record<string, V[]>> = {}

  get subLists(): MaybeRef<Record<string, V[]>> {
    return this._subLists
  }

  public async get(key: string): Promise<V | undefined> {
    return await super.get(key).then((result: V | undefined) => {
      if (result) {
        this.updateSecondaryMaps(result)
        this.updateSubLists()
      }
      return result
    })
  }

  public async getAll(refresh?: boolean): Promise<Record<string, V>> {
    const items = await super.getAll(refresh)
    if (!items) {
      throw new Error("No items found")
    }
    return items
  }

  public async bulkAdd(items: V[]): Promise<void> {
    items.forEach(item => {
      this.set(item[this.keyProperty], item)
    })
    this.secondaryMaps.forEach(map => {
      map.bulkAdd(items)
    })
  }

  public async addSecondaryMap(map: MegaMap<string, V>) {
    this.secondaryMaps.push(map)
    await map.bulkAdd(Object.values(this._map))
  }

  public filterItems(criteria: (value: V) => boolean): V[] {
    return Object.values(this._map).filter((value) => criteria(value))
  }

  public sortItems(comparator: (a: V, b: V) => number): V[] {
    return Object.values(this._map).sort(comparator)
  }

  public searchItems(query: string): V[] {
    let results: V[] = []
    // first try exact matches
    results = Object.values(this._map).filter((item: V) => {
      for (const field of this._searchableFields) {
        if (field in item) {
          const val = item[field as keyof typeof item] as string
          if (val.toLowerCase().includes(query.toLowerCase())) {
            return true
          }
        }
      }
      return false
    })

    // if no exact matches, do fuzzy search
    if (results.length === 0) {
      const fuse = new Fuse(Object.values(this._map), {
        keys: this._searchableFields, threshold: 0.5
      })
      try {
        results = fuse.search(query).map(result => result.item)
      } catch (err) {
        console.error(err)
        results = []
      }
    }

    return results
  }

  public set(key: string, value: V): this {
    super.set(key, value)
    this.notifyMapUpdated()
    return this
  }

  public delete(key: string): boolean {
    const result = super.delete(key)
    this.notifyMapUpdated()
    return result
  }

  public clear(): void {
    super.clear()
    this.notifyMapUpdated()
  }

  async init(opts: MegaMapOptions<string, V>) {
    this._subLists = {}

    for (const filterKey in this._subListFilters) {
      this._subLists[filterKey] = []
    }

    if (opts.loadAll) {
      this.getAll().catch((err) => {
        console.error(err)
      })
    }

  }

  updateSubLists() {
    for (const [filterKey, filter] of Object.entries(this._subListFilters)) {
      this._subLists[filterKey] = Object.values(this._map).filter(filter)
    }
  }

  notifyMapUpdated() {
    this.updateSubLists()
    this.secondaryMaps.forEach(map => {
      map.notifyMapUpdated()
    })

    this.emit("updated")
  }

  private updateSecondaryMaps(item: V) {
    this.secondaryMaps.forEach(map => {
      map.set(item[map.keyProperty], item)
    })
  }
}
