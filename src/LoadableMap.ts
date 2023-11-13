import { computed } from "vue"

export interface LoadableMapOptions<K, V> {
    loadOne: (key: string) => Promise<V | undefined>,
    loadAll?: () => Promise<V[] | Map<string, V>>,
    keyProperty?: string,
    onUpdated?: () => void
    namedQueries?: Record<string, (queryName: string, ...args: any[]) => Promise<V | V[] | undefined>>
}

export type WithKeyProperty<K extends string | number | symbol, V> = V & Record<string, any>;

export class LoadableMap<K, V extends Record<string, any>> {
    readonly [Symbol.toStringTag]: string = "LoadableMap"
    keyProperty: string
    protected _map: Map<string, V> = new Map<string, V>()
    computedValues = computed(() => this._map.values())
    protected loading: Map<string, Promise<V | undefined>> = new Map<string, Promise<V | undefined>>()
    protected loadingAll: Promise<Map<string, V> | undefined> | undefined
    protected loadingBy: Map<string, Promise<V | undefined>> = new Map<string, Promise<V | undefined>>()
    protected readonly loadOne: (key: string) => Promise<V | undefined>
    private readonly loadAll?: () => Promise<V[] | Map<string, V>>
    private readonly _namedQueries?: Record<string, (...args: any[]) => Promise<V | V[] | undefined>>
    private readonly _namedQueryData: Record<any, V | V[]> = {}
    private readonly _queryExecutors: Record<string, (...args: any[]) => Promise<V | V[] | undefined>> = {}

    constructor(opts: LoadableMapOptions<string, V>) {
        if (!opts.loadOne) {
            throw new Error("loadOne function is not defined, at minimum loadOne function must be defined")
        }

        this.keyProperty = opts.keyProperty || "_id"
        this.loadOne = opts.loadOne
        this.loadAll = opts.loadAll
        this._namedQueries = opts.namedQueries

        for (const queryName in this._namedQueries) {
            this._queryExecutors[queryName] = async (...args: any[]) => this.executeQuery(queryName, ...args)
        }

        this.onUpdated = opts.onUpdated
    }

    get size(): number {
        return this._map.size
    }

    get value() {
        return this
    }

    get query() {
        return this._queryExecutors
    }

    // namedQueries() {
    //
    //     if (!this._namedQueries) {
    //         throw new Error("Named queries are not defined")
    //     }
    //     const key = this._namedQueryKey(name, ...args)
    //     return this._namedQueryData[key]
    // }

    onUpdated: () => void = () => {
    }

    public async get(key: string): Promise<V | undefined> {
        if (key === undefined) {
            throw new Error("Key is undefined")
        }

        if (this.loading.has(key)) {
            return this.loading.get(key)
        }

        if (this._map.has(key)) {
            return this._map.get(key)
        }

        const result = await this.loadOne(key)
        if (result) {
            this.set(key, result)
            return this.processLoadResult([result]).get(key)
        }
        if (result) {
            return result
        }

        return undefined
    }

    public async load(key: string): Promise<V | undefined> {
        return await this.get(key)
    }

    public async getBy(propName: string, value: any): Promise<V | undefined> {
        const result = [...this._map.values()].find((item) => item[propName] === value)
        if (result) {
            return result
        }
        // return await this.loadBy(propName, value)
    }

    set(key: string, value: V) {
        this._map.set(key, value)
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
        return this._map.values()
    }

    mapRef(): Map<string, V> {
        return this._map
    }

    keys(): IterableIterator<string> {
        return this._map.keys()
    }

    entries(): IterableIterator<[string, V]> {
        return this._map.entries()
    }

    [Symbol.iterator](): IterableIterator<[string, V]> {
        return this._map.entries()
    }

    forEach(callbackfn: (value: V, key: string, map: Map<string, V>) => void, thisArg?: any): void {
        return this._map.forEach(callbackfn, thisArg)
    }

    clear(): void {
        return this._map.clear()
    }

    delete(key: string): boolean {
        if (!this._map.has(key)) {
            return false
        }
        return this._map.delete(key)
    }

    deleteBy(propName: string, value: any): boolean {
        const item = [...this._map.values()].find((item) => item[propName] === value)
        if (item) {
            return this._map.delete(item[this.keyProperty])
        }
        return false
    }

    has(key: string): boolean {
        return this._map.has(key)
    }

    async doQuery(queryName: string, ...args: any[]): Promise<V | V[] | undefined> {
        if (!this._namedQueries) {
            throw new Error("Named queries are not defined")
        }

        if (!this._namedQueries[queryName]) {
            throw new Error(`Query ${queryName} is not defined`)
        }

        return await this._namedQueries[queryName](...args)
    }

    async executeQuery(queryName: string, ...args: any[]): Promise<V | V[] | undefined> {

        const result = await this.doQuery(queryName, ...args)
        if (result) {
            if (Array.isArray(result)) {
                result.forEach((item) => {
                    this.set(item[this.keyProperty], item)
                })
                return result as V[]
            } else {
                this.set(result[this.keyProperty], result)
                return result
            }
        }
        return undefined
    }

    private _namedQueryKey(name, ...args) {
        return `${name}(${args.join(":")})`
    }

    private processLoadResult(result: V[] | Map<string, V>): Map<string, V> {
        if (result instanceof Map) {
            result.forEach((value, key) => {
                this._map.set(this.keyProperty, value)
            })
        } else {
            result.forEach((item: V) => {
                this._map.set(item[this.keyProperty], item)
            })
        }
        if (this.onUpdated) {
            this.onUpdated()
        }
        return this._map
    }
}
