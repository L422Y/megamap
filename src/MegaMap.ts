import { CachedLoadableMap } from "./CachedLoadableMap"
import type { Ref, ShallowRef } from "vue"
import { isRef, reactive, ref } from "vue"
import Fuse from "fuse.js"

interface MegaMapOptions<K, V> {
    loadOne: (key: string) => Promise<V | undefined>,
    loadAll?: () => Promise<Map<string, V> | V[]>,
    expiryInterval?: number,
    keyProperty?: string,
    secondaryMaps?: Array<MegaMap<any, any> | Ref<MegaMap<any, any>>>,
    filter?: (item: V) => boolean,
    sort?: (item1: V, item2: V) => number,
    searchableFields?: string[]
    subListFilters?: Record<string, (item: V) => boolean>;
    onUpdated?: () => void
}


export class MegaMap<K, V extends Record<string, any>> extends CachedLoadableMap<string, V> {
    readonly [Symbol.toStringTag]: string = "MegaMap"
    _refInstance: ShallowRef<MegaMap<K, V>>
    protected _triggerRef?: Function
    private readonly subLists: Record<string,Ref<V[]>>
    private secondaryMaps: Array<MegaMap<string, V> | Ref<MegaMap<string, V>>> = []
    private readonly _filter?: (item: V) => boolean
    private readonly _sort?: (item1: V, item2: V) => number
    private readonly _searchableFields: string[]
    private readonly _subListFilters: Record<string, (item: V) => boolean>

    constructor(opts: MegaMapOptions<string, V>) {
        super(opts)
        this.secondaryMaps = opts.secondaryMaps || []
        this._filter = opts.filter
        this._sort = opts.sort
        this._searchableFields = opts.searchableFields ?? []
        this._subListFilters = opts.subListFilters || {}
        this.subLists = reactive({})
        this.onUpdated = opts.onUpdated

        for (const filterKey in this._subListFilters) {
            this.subLists[filterKey] = ref([] as V[])
        }

        this.getAll().then(() => {
            this.updateSubLists()
        })
        this.notifyMapUpdated()

        if (this.onUpdated) {
            this.onUpdated()
        }
    }

    // static ReactiveMegaMap = (opts: MegaMapOptions<any, any>): ShallowRef<MegaMap<any, any>> => {
    //     const megaMap = shallowRef(new MegaMap(opts))
    //     megaMap.onUpdated = () => {
    //         triggerRef(megaMap)
    //         opts.onUpdated?.()
    //     }
    //     return megaMap
    // }

    public async get(key: string): Promise<V | undefined> {
        return await super.get(key).then((result: V | undefined) => {
            if (result) {
                this.updateSecondaryMaps(result)
                this.updateSubLists()
            }
            return result
        })
    }

    public async getAll(): Promise<Map<string, V>> {
        const items = await super.getAll()
        if (!items) {
            throw new Error("No items found")
        }
        this.updateSubLists()
        return items
    }

    public async bulkAdd(items: V[]): Promise<void> {
        items.forEach(item => {
            this.set(item[this.keyProperty], item)
        })
        this.secondaryMaps.forEach(map => {
            if (isRef(map)) {
                map.value.bulkAdd(items)
            } else {
                map.bulkAdd(items)
            }
        })
    }

    public async addSecondaryMap(map: MegaMap<string, V> | Ref<MegaMap<string, V>>) {
        this.secondaryMaps.push(map)
        if (isRef(map)) {
            await map.value.bulkAdd(Array.from(this._map.value.values()))
        } else {
            await map.bulkAdd(Array.from(this._map.value.values()))
        }
    }

    public filterItems(criteria: (value: V) => boolean): V[] {
        return [...this.values()].filter((value) => criteria(value))
    }

    public sortItems(comparator: (a: V, b: V) => number): V[] {
        return [...this.values()].sort(comparator)
    }

    public searchItems(query: string): V[] {
        let results: V[] = []
        // first try exact matches
        results = [...this.values()].filter((item: V) => {
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
            const fuse = new Fuse(Array.from(this.values()), {
                keys: this._searchableFields,
                threshold: 0.5
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


    // SUB LISTS

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

    private updateSecondaryMaps(item: V) {
        this.secondaryMaps.forEach(map => {
            if (isRef(map)) {
                map.value.set(item[map.value.keyProperty], item)
            } else if (map instanceof MegaMap) {
                map.set(item[map.keyProperty], item)
            }
        })
    }

    private updateSubLists() {
        for (const [filterKey, filter] of Object.entries(this._subListFilters)) {
            this.subLists[filterKey].value = [...this.values()].filter(filter)
        }
    }

    private notifyMapUpdated() {
        this.updateSubLists()
        this.secondaryMaps.forEach(map => {
            if (isRef(map)) {
                map.value.notifyMapUpdated()
            } else if (map instanceof MegaMap) {
                map.notifyMapUpdated()
            }
        })
        console.log("notifyMapUpdated", this._refInstance)
        if (this.onUpdated) {
            super.onUpdated && super.onUpdated()
            this.onUpdated()
        }
    }
}
