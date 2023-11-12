import { computed, Ref, ref } from "vue"

export interface LoadableMapOptions<K, V> {
    loadOne: (key: string) => Promise<V | undefined>,
    loadAll?: () => Promise<V[] | Map<string, V>>,
    keyProperty?: string,
    onUpdated?: () => void
}

export type WithKeyProperty<K extends string | number | symbol, V> = V & Record<string, any>;

export class LoadableMap<K, V extends Record<string, any>> {
    readonly [Symbol.toStringTag]: string = "LoadableMap"
    keyProperty: string
    protected _map: Ref<Map<string, V>> = ref(new Map<string, V>())
    computedValues = computed(() => this._map.value.values())
    protected loading: Map<string, Promise<V | undefined>> = new Map<string, Promise<V | undefined>>()
    protected loadingAll: Promise<Map<string, V> | undefined> | undefined
    protected readonly loadOne: (key: string) => Promise<V | undefined>
    private readonly loadAll?: () => Promise<V[] | Map<string, V>>

    constructor(opts: LoadableMapOptions<string, V>) {
        this.keyProperty = opts.keyProperty || "_id"
        this.loadOne = opts.loadOne
        this.loadAll = opts.loadAll
        this.onUpdated = opts.onUpdated
    }

    get size(): number {
        return this._map.value.size
    }

    get value() {
        return this
    }

    onUpdated: () => void = () => {
    }

    public async load(key: string): Promise<V | undefined> {
        const result: V | undefined = await this.loadOne(key)
        if (result) {
            return this.processLoadResult([result]).get(key)
        }
    }

    public async get(key: string): Promise<V | undefined> {
        if (key === undefined) {
            throw new Error("Key is undefined")
        }

        if (this.loading.has(key)) {
            return this.loading.get(key)
        }

        if (this._map.value.has(key)) {
            return this._map.value.get(key)
        }

        const result = await this.load(key)
        if (result) {
            return result
        }

        return undefined
    }

    set(key: string, value: V) {
        this._map.value.set(key, value)
        if (this.onUpdated) {
            this.onUpdated()
        }
        return this
    }

    public async getAll(): Promise<Map<string, V> | undefined> {
        if (!this.loadAll) {
            throw new Error("Load all items function is not defined")
        }

        if (this.loadingAll) {
            return this.loadingAll
        }

        this.loadingAll = this.loadAll().then((result: V[] | Map<string, V>) => {
            this.loadingAll = undefined
            return this.processLoadResult(result)
        })

        return this.loadingAll
    }

    values(): IterableIterator<V> {
        return this._map.value.values()
    }

    // return this._map.value as Map<string, V>
    mapRef(): Map<string, V> {
        return this._map.value
    }


    keys(): IterableIterator<string> {
        return this._map.value.keys()
    }

    entries(): IterableIterator<[string, V]> {
        return this._map.value.entries()
    }

    [Symbol.iterator](): IterableIterator<[string, V]> {
        return this._map.value.entries()
    }

    forEach(callbackfn: (value: V, key: string, map: Map<string, V>) => void, thisArg?: any): void {
        return this._map.value.forEach(callbackfn, thisArg)
    }

    clear(): void {
        return this._map.value.clear()
    }

    delete(key: string): boolean {
        if (!this._map.value.has(key)) {
            return false
        }
        return this._map.value.delete(key)
    }

    deleteBy(propName: string, value: any): boolean {
        const item = [...this._map.value.values()].find((item) => item[propName] === value)
        if (item) {
            return this._map.value.delete(item[this.keyProperty])
        }
        return false
    }

    has(key: string): boolean {
        return this._map.value.has(key)
    }

    async getBy(propName: string, value: any): Promise<V | undefined> {
        const result = [...this._map.value.values()].find((item) => item[propName] === value)
        if (!result) {
            await this.get(value).then((item) => {
                if (item) {
                    return item
                }
            })
        }
        return result
    }

    private processLoadResult(result: V[] | Map<string, V>): Map<string, V> {
        if (result instanceof Map) {
            result.forEach((value, key) => {
                this._map.value.set(this.keyProperty, value)
            })
        } else {
            result.forEach((item: V) => {
                this._map.value.set(item[this.keyProperty], item)
            })
        }
        if (this.onUpdated) {
            this.onUpdated()
        }
        return this._map.value
    }
}
