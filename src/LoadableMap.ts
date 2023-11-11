export interface LoadableMapOptions<K, V> {
    loadOne: (key: K) => Promise<V | undefined>,
    loadAll?: () => Promise<V[] | Map<K, V>>,
    keyProperty?: keyof V
}

export type WithKeyProperty<K extends string | number | symbol, V> = V & Record<K, any>;

export class LoadableMap<K, V extends Record<string, any>> {
    keyProperty: keyof V = "_id" as keyof V
    protected _map: Map<K, V> = new Map<K, V>()
    protected loading: Map<K, Promise<V | undefined>> = new Map<K, Promise<V | undefined>>()
    protected loadingAll: Promise<Map<K, V> | undefined> | undefined
    protected readonly loadOne: (key: K) => Promise<V | undefined>
    private readonly loadAll?: () => Promise<V[] | Map<K, V>>

    constructor({loadOne, loadAll, keyProperty}: LoadableMapOptions<K, V>) {
        this.keyProperty = keyProperty as keyof V || "_id" as keyof V
        this.loadOne = loadOne
        this.loadAll = loadAll
    }

    get size(): number {
        return this._map.size
    }

    public async get(key: K): Promise<V | undefined> {
        if (key === undefined) {
            throw new Error("Key is undefined")
        }

        if (this.loading.has(key)) {
            return this.loading.get(key)
        }

        if (this._map.has(key)) {
            return this._map.get(key)
        }

        const result: V | undefined = await this.loadOne(key)
        if (result) {
            return this.processLoadResult([result]).get(key)
        }

        return undefined
    }

    set(key: K, value: V) {
        this._map.set(key, value)
        return this
    }

    public async getAll(): Promise<Map<K, V> | undefined> {
        if (!this.loadAll) {
            throw new Error("Load all items function is not defined")
        }

        if (this.loadingAll) {
            return this.loadingAll
        }

        this.loadingAll = this.loadAll().then((result: V[] | Map<K, V>) => {
            this.loadingAll = undefined
            return this.processLoadResult(result)
        })

        return this.loadingAll
    }

    values(): IterableIterator<V> {
        return this._map.values()
    }

    keys(): IterableIterator<K> {
        return this._map.keys()
    }

    entries(): IterableIterator<[K, V]> {
        return this._map.entries()
    }

    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this._map.entries()
    }

    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        return this._map.forEach(callbackfn, thisArg)
    }

    clear(): void {
        return this._map.clear()
    }

    delete(key: K): boolean {
        return this._map.delete(key)
    }

    has(key: K): boolean {
        return this._map.has(key)
    }

    private processLoadResult(result: V[] | Map<K, V>): Map<K, V> {
        if (result instanceof Map) {
            result.forEach((value, key) => {
                this._map.set(key, value)
            })
        } else {
            result.forEach((item: V) => {
                this._map.set(item[this.keyProperty], item)
            })
        }

        return this._map
    }
}
