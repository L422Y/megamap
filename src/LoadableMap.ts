export interface LoadableMapOptions<K extends string, V> {
  loadOne: (key: K) => Promise<V | undefined>,
  loadAll?: () => Promise<V[] | Record<K, V>>,
  keyProperty?: string,
  onUpdated?: () => void
  namedQueries?: Record<string, (queryName: string, ...args: any[]) => Promise<V | V[] | undefined>>
  refreshInterval?: number
}

export type WithKeyProperty<K extends string | number | symbol, V> = V & Record<string, any>;

type RefreshableRecord = Record<string, any & { refreshed_at: Date }>

export function useLoadableMap<K extends string, V extends RefreshableRecord>(opts: LoadableMapOptions<K, V>) {
  return new LoadableMap<K, V>(opts)
}

export class LoadableMap<K extends string, V extends RefreshableRecord> {
  readonly [Symbol.toStringTag]: string = "LoadableMap"
  keyProperty: string
  public readonly isLoading = {
    all: false,
    loadingBy: false,
    loadingQuery: false
  }
  public readonly hasLoadedOnce = {
    all: false,
    loadingBy: false,
    loadingQuery: false
  }
  protected _map: Record<K, V> = {} as Record<K, V>
  protected loading: Record<K, Promise<V | undefined>> = {} as Record<K, Promise<V | undefined>>
  protected loadingQuery: Record<string, Promise<V | V[] | undefined>> = {} as Record<string, Promise<V | V[] | undefined>>
  protected loadingAll: Promise<Record<K, any> | undefined> | undefined
  protected loadingBy: Record<string, Promise<V | undefined>> = {} as Record<string, Promise<V | undefined>>
  protected readonly loadOne: (key: K) => Promise<V | undefined>
  protected readonly _namedQueries?: Record<string, (...args: any[]) => Promise<V | V[] | undefined>>
  protected readonly _queryExecutors: Record<string, (...args: any[]) => Promise<V | V[] | undefined>> = {}
  private readonly loadAll?: () => Promise<V[] | Record<K, RefreshableRecord>>
  private readonly _namedQueryData: Record<any, V | V[]> = {}
  private _refreshInterval?: number
  private _refreshIntervalId?: number
  /** event handling **/


  private eventListeners: Record<string, Function[]> = {}

  constructor(opts: LoadableMapOptions<K, V>) {
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

  /**
   * Returns the number of items in the map
   */
  get size(): number {
    return Object.keys(this._map).length
  }

  /**
   * Returns a reference to the internal Record object
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

  public async get(key: K): Promise<V | undefined> {
    if (key === undefined) {
      throw new Error("Key is undefined")
    }

    if (this.loading[key]) {
      return this.loading[key] as Promise<V | undefined>
    }

    if (this._map[key]) {
      return this._map[key]
    }

    const result = new Promise<V | undefined>((resolve) => {
      this.loadOne(key)
         .then((result: V | undefined) => {
           this.set(key, result)
           this.processLoadResult([result]).then(() => {
             resolve(result)
           })
           delete this.loading[key]
           this.emit("updated")
           return result
         }).catch((err) => {
        console.error(err)
        resolve(undefined)
      })
    })

    this.loading[key] = result

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
  public async load(key: K): Promise<V | undefined> {
    return await this.get(key)
  }

  /**
   * Gets an item from the map by a property name and value
   * @param propName
   * @param value
   */
  public async getBy(propName: string, value: any): Promise<V | undefined> {
    const result = Object.values(this._map).find((item) => item[propName] === value)
    if (result) {
      return result as V
    }
  }

  /**
   * Sets a value for a key in the map
   * @param key
   * @param value
   */
  set(key: K, value: V) {
    this._map[key] = value
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
  public async getAll(refresh?: boolean): Promise<Record<K, V> | undefined> {
    if (!this.loadAll) {
      throw new Error("Load all items function is not defined")
    }

    if (this.loadingAll) {
      return this.loadingAll
    }

    if (!refresh && Object.keys(this._map).length > 0) {
      return this._map
    }

    this.loadingAll = new Promise<any>(async (resolve) => {
      return this.loadAll().then((result: any[] | Record<K, any>) => {
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
    return Object.values(this._map)[Symbol.iterator]() as IterableIterator<V>
  }

  /**
   * Returns an iterator of keys in the map
   */
  keys(): IterableIterator<K> {
    return Object.keys(this._map)[Symbol.iterator]() as IterableIterator<K>
  }

  /**
   * Returns an iterator of entries in the map
   */
  entries(): IterableIterator<[K, V]> {
    return Object.entries(this._map)[Symbol.iterator]() as IterableIterator<[K, V]>
  }

  /**
   * Returns an iterator of entries in the map
   */
  [Symbol.iterator](): IterableIterator<V> {
    return Object.values(this._map)[Symbol.iterator]() as IterableIterator<V>
  }

  forEach(callbackfn: (value: V, key: K, map: Record<K, V>) => void, thisArg?: any): void {
    Object.entries(this._map).forEach(([key, value]) => {
      callbackfn.call(thisArg, value, key as K, this._map)
    })
  }

  /**
   * Removes all key/value pairs from the Record object.
   */
  clear(): void {
    this._map = {} as Record<K, V>
  }

  /**
   * Removes any value associated to the key and returns the value that Record.prototype.has(key) would have previously returned.
   * @param key
   */
  delete(key: K): boolean {
    if (!this._map[key]) {
      return false
    }
    delete this._map[key]
    return true
  }

  /**
   * Removes any value associated to the key and returns the value that Record.prototype.has(key) would have previously returned.
   * @param propName
   * @param value
   */
  deleteBy(propName: string, value: any): boolean {
    const item = Object.values(this._map).find((item) => item[propName] === value)
    if (item) {
      delete this._map[item[this.keyProperty]]
      return true
    }
    return false
  }

  /**
   * Returns a boolean asserting whether a value has been associated to the key in the Record object or not.
   * @param key
   */
  has(key: K): boolean {
    return this._map[key] !== undefined
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

  private _updateLoadingStatus() {
    this.isLoading.all = this.loadingAll !== undefined
    this.isLoading.loadingBy = Object.keys(this.loadingBy).length > 0
    this.isLoading.loadingQuery = Object.keys(this.loadingQuery).length > 0
    this.hasLoadedOnce.all ||= this.loadingAll !== undefined
    this.hasLoadedOnce.loadingBy ||= Object.keys(this.loadingBy).length > 0
    this.hasLoadedOnce.loadingQuery ||= Object.keys(this.loadingQuery).length > 0
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
  private async processLoadResult(result: any[] | Record<K, any>): Promise<Record<K, V>> {
    if (result instanceof Object && !Array.isArray(result)) {
      Object.entries(result).forEach(([key, value]) => {
        value.refreshed_at = new Date()
        this._map[key as K] = value as V
      })
    } else {
      ( result as any[] ).forEach((item: any) => {
        if (!!item) {
          item.refreshed_at = new Date()
          this._map[item[this.keyProperty]] = item as V
        }
      })
    }
    this.loadingAll = undefined
    this.emit("updated")
    return this._map
  }
}
