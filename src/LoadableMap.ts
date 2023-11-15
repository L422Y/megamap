// import { computed, reactive, ref } from "vue"

export interface LoadableMapOptions<K, V> {
    loadOne: (key: string) => Promise<V | undefined>,
    loadAll?: () => Promise<V[] | Map<string, V>>,
    keyProperty?: string,
    onUpdated?: () => void
    namedQueries?: Record<string, (queryName: string, ...args: any[]) => Promise<V | V[] | undefined>>
    refreshInterval?: number
}

export type WithKeyProperty<K extends string | number | symbol, V> = V & Record<string, any>;

type RefreshableRecord = Record<string, any & { refreshed_at: Date }>

export class LoadableMap<K, V extends RefreshableRecord> {
    readonly [Symbol.toStringTag]: string = "LoadableMap"
    keyProperty: string
    protected _map: Map<string, V> = new Map<string, V>()
    protected loading: Map<string, Promise<V | undefined>> = new Map<string, Promise<V | undefined>>()
    protected loadingQuery: Map<string, Promise<V | V[] | undefined>> = new Map<string, Promise<V | V[] | undefined>>()
    protected loadingAll: Promise<Map<string, any> | undefined> | undefined
    protected loadingBy: Map<string, Promise<V | undefined>> = new Map<string, Promise<V | undefined>>()
    protected readonly loadOne: (key: string) => Promise<V | undefined>
    private readonly loadAll?: () => Promise<V[] | Map<string, RefreshableRecord>>
    protected readonly _namedQueries?: Record<string, (...args: any[]) => Promise<V | V[] | undefined>>
    private readonly _namedQueryData: Record<any, V | V[]> = {}
    protected readonly _queryExecutors: Record<string, (...args: any[]) => Promise<V | V[] | undefined>> = {}
    private _refreshInterval?: number
    private _refreshIntervalId?: number

    constructor(opts: LoadableMapOptions<string, V>) {
        if (!opts.loadOne) {
            throw new Error("loadOne function is not defined, at minimum loadOne function must be defined")
        }

        this.keyProperty = opts.keyProperty || "_id"
        this.loadOne = opts.loadOne
        this.loadAll = opts.loadAll
        this._namedQueries = opts.namedQueries


        for (const queryName in this._namedQueries) {
            this._queryExecutors[queryName] = async (...args: any[]) => this.executeQuery(queryName, ...args.slice(1))
        }

        if (opts.onUpdated) {
            this.on("updated", opts.onUpdated)

        }
        this.on("updated", () => {
            this._updateLoadingStatus()
        })
        if (opts.refreshInterval) {
            this._refreshInterval = opts.refreshInterval
            this._refreshIntervalId = setInterval(async function () {
                await this.getAll(true)
            }.bind(this), this._refreshInterval)
        }
    }

    private _updateLoadingStatus() {
        this.isLoading.all = this.loadingAll !== undefined
        this.isLoading.loadingBy = this.loadingBy.size > 0
        this.isLoading.loadingQuery = this.loadingQuery.size > 0
    }

    public readonly isLoading = {
        all: false,
        loadingBy: false,
        loadingQuery: false
    }

    /**
     * Returns the number of items in the map
     */
    get size(): number {
        return this._map.size
    }

    /**
     * Returns a reference to the internal Map object
     */
    get value() {
        return this._map
    }

    /**
     * Returns a reference to the query executor functions
     * @example
     * megaMap.query.myQueryName(arg1, arg2).then((result) => {
     *    // do something with result
     * })
     */
    get query() {
        return this._queryExecutors
    }

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

        const result = new Promise<V | undefined>((resolve) => {
            this.loadOne(key)
                .then((result: V | undefined) => {
                    this.set(key, result)
                    this.processLoadResult([result]).then(() => {
                        resolve(result)
                    })
                    this.loading.delete(key)
                    this.emit("updated")
                    return result
                }).catch((err) => {
                console.error(err)
                resolve(undefined)
            })
        })

        this.loading.set(key, result)

        if (result) {
            this.emit("updated")
            return await result
        }

        return undefined
    }

    /**
     * Loads an item from the map by key, if the item is not found in the map, the loadOne function is called
     * @param key
     */
    public async load(key: string): Promise<V | undefined> {
        return await this.get(key)
    }

    /**
     * Gets an item from the map by a property name and value
     * @param propName
     * @param value
     */
    public async getBy(propName: string, value: any): Promise<V | undefined> {
        const result = [...this._map.values()].find((item) => item[propName] === value)
        if (result) {
            return result
        }
        // return await this.loadBy(propName, value)
    }

    /**
     * Sets a value for a key in the map
     * @param key
     * @param value
     */
    set(key: string, value: V) {
        this._map.set(key, value)
        this.emit("updated")
        return this
    }

    async forceRefresh() {
        const result = await this.loadAll()
        if (result) {
            this.processLoadResult(result)
        }
    }

    /**
     * Gets all items from the map, if the map is empty or refresh is true, the loadAll function is called,
     * otherwise the existing map is returned.
     * @param refresh
     */
    public async getAll(refresh?: boolean): Promise<Map<string, V> | undefined> {
        if (!this.loadAll) {
            throw new Error("Load all items function is not defined")
        }

        if (this.loadingAll) {
            return this.loadingAll
        }

        if (!refresh && this._map.size > 0) {
            return this._map
        }

        this.loadingAll = new Promise<any>(async (resolve) => {
            return this.loadAll().then((result: any[] | Map<string, any>) => {
                this.processLoadResult(result).then((result) => {
                    resolve(result)
                })
            }).catch((err) => {
                console.error(err)
                resolve(undefined)
            }).finally(() => {
                this.loadingAll = undefined
            })
        })
        this.emit("updated")

        return this.loadingAll
    }

    /**
     * Returns an iterator of values in the map
     */
    values(): IterableIterator<V> {
        return this._map.values()
    }

    /**
     * Returns an iterator of keys in the map
     */
    keys(): IterableIterator<string> {
        return this._map.keys()
    }

    /**
     * Returns an iterator of entries in the map
     */
    entries(): IterableIterator<[string, V]> {
        return this._map.entries()
    }

    /**
     * Returns an iterator of entries in the map
     */
    [Symbol.iterator](): IterableIterator<V> {
        return this._map.values()
    }

    forEach(callbackfn: (value: V, key: string, map: Map<string, V>) => void, thisArg?: any): void {
        return this._map.forEach(callbackfn, thisArg)
    }

    /**
     * Removes all key/value pairs from the Map object.
     */
    clear(): void {
        return this._map.clear()
    }

    /**
     * Removes any value associated to the key and returns the value that Map.prototype.has(key) would have previously returned.
     * @param key
     */
    delete(key: string): boolean {
        if (!this._map.has(key)) {
            return false
        }
        return this._map.delete(key)
    }

    /**
     * Removes any value associated to the key and returns the value that Map.prototype.has(key) would have previously returned.
     * @param propName
     * @param value
     */
    deleteBy(propName: string, value: any): boolean {
        const item = [...this._map.values()].find((item) => item[propName] === value)
        if (item) {
            return this._map.delete(item[this.keyProperty])
        }
        return false
    }

    /**
     * Returns a boolean asserting whether a value has been associated to the key in the Map object or not.
     * @param key
     */
    has(key: string): boolean {
        return this._map.has(key)
    }

    /**
     * Executes a named query and stores the result in the map
     * @param queryName
     * @param args
     */
    async executeQuery(queryName: string, ...args: any[]): Promise<V | V[] | undefined> {

        const result = await this._doQuery(queryName, ...args)
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

    /**
     * Executes a named query
     * @param queryName
     * @param args
     */
    private async _doQuery(queryName: string, ...args: any[]): Promise<V | V[] | undefined> {


        if (!this._namedQueries) {
            throw new Error("Named queries are not defined")
        }

        if (!this._namedQueries[queryName]) {
            throw new Error(`Query ${queryName} is not defined`)
        }

        return await this._namedQueries[queryName](...args)
    }

    /**
     * Generates a key for a named query
     * @param name
     * @param args
     * @private
     */
    private _namedQueryKey(name, ...args) {
        return `${name}(${args.join(":")})`
    }

    /**
     * Processes the result of a loadAll function
     * @param result
     * @private
     */
    private async processLoadResult(result: any[] | Map<string, any>): Promise<Map<string, V>> {
        if (result instanceof Map) {
            result.forEach((value, key) => {
                value.refreshed_at = new Date()
                this._map.set(this.keyProperty, value as V)
            })
        } else {
            result.forEach((item: any) => {
                if(!!item) {
                    item.refreshed_at = new Date()
                    this._map.set(item[this.keyProperty], item as V)
                }
            })
        }
        this.loadingAll = undefined

        console.timeEnd("loadAll")

        this.emit("updated")

        return this._map
    }

    /** event handling **/


    private eventListeners: Record<string, Function[]> = {}

    /**
     * Adds an event listener
     * @param event
     * @param listener
     */
    on(event: string, listener: Function) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = []
        }
        this.eventListeners[event].push(listener)
    }

    /**
     * Removes an event listener
     * @param event
     * @param listener
     */
    off(event: string, listener: Function) {
        if (!this.eventListeners[event]) {
            return
        }
        this.eventListeners[event] = this.eventListeners[event].filter(l => l !== listener)
    }

    /**
     * Emits an event
     * @param event
     * @param args
     */
    protected emit(event: string, ...args: any[]) {
        if (!this.eventListeners[event]) {
            return
        }
        this.eventListeners[event].forEach(listener => listener(...args))
    }
}
