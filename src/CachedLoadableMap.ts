import { LoadableMap, LoadableMapOptions, LoadingState } from "./LoadableMap"

export type CachedLoadableMapOptions<K extends string, V> = {
  loadOne: (key: string) => Promise<V | undefined>
  loadAll?: () => Promise<V[] | Record<string, V>>
  expiryInterval?: number
  keyProperty?: string
} & LoadableMapOptions<K, V>

export function useCachedLoadableMap<K extends string, V extends Record<string, any>>(opts: CachedLoadableMapOptions<K, V>) {
  return new CachedLoadableMap<K, V>(opts)
}

export class CachedLoadableMap<K, V extends Record<string, any>> extends LoadableMap<string, V> {
  [Symbol.toStringTag]: string = "CachedLoadableMap"
  private readonly expiryInterval?: number
  private _cachedQueryExecutors: Record<string, (...args: any[]) => Promise<V | V[]>> = {}
  private _cachedQueryData: Record<string, V | V[]> = {}

  constructor(opts: CachedLoadableMapOptions<string, V>) {
    super(opts)
    this.expiryInterval = opts.expiryInterval

    for (const queryName in this._namedQueries) {
      this._cachedQueryExecutors[queryName] = async (...args: any[]) => this.executeCachedQuery(queryName, ...args)
    }
  }

  get query(): Record<string, (...args: any[]) => Promise<V | V[]>> {
    return this._cachedQueryExecutors
  }

  async executeCachedQuery(queryName: string, ...args: any[]): Promise<V | V[]> {
    const queryKey = `${queryName}:${args.join(":")}`

    try {
      this.isLoading.loadingQuery = LoadingState.LOADING

      if (this.loadingQuery[queryKey]) {
        return this.loadingQuery[queryKey]
      }

      const cacheExpiry = this.refreshedAtMap[queryKey]
      const now = Date.now()

      if (this._cachedQueryData[queryKey] && cacheExpiry) {
        if (this.expiryInterval === undefined || now < cacheExpiry.getTime() + this.expiryInterval) {
          return this._cachedQueryData[queryKey]
        }
      }

      const promise = this._namedQueries[queryName](queryName, ...args).then((result: V | V[]) => {
        this._cachedQueryData[queryKey] = result
        this.refreshedAtMap[queryKey] = new Date()
        delete this.loadingQuery[queryKey]
        return result
      }).catch((error) => {
        delete this.loadingQuery[queryKey]
        throw error
      })

      this.loadingQuery[queryKey] = promise
      return promise
    } finally {
      this.isLoading.loadingQuery = LoadingState.LOADED
      this.hasLoadedOnce.loadingQuery = LoadingState.LOADED
      this._updateLoadingStatus()
    }
  }

  public async get(key: string): Promise<V | undefined> {
    if (key === undefined) {
      throw new Error("Key is undefined")
    }

    try {
      // Add loading state for this specific key
      this.loading[key] = true
      this.isLoading.loadingBy = LoadingState.LOADING
      this._updateLoadingStatus()

      const cacheExpiry = this.refreshedAtMap[key]
      const now = Date.now()

      // If we have a cached item, check if it's expired
      if (this._map[key] && cacheExpiry) {
        if (this.expiryInterval === undefined || now < cacheExpiry.getTime() + this.expiryInterval) {
          delete this.loading[key] // Clear loading state for cached hits
          return this._map[key]
        }
      }

      // If already loading, return existing promise
      if (this.loading[key] && this.loading[key] instanceof Promise) {
        return this.loading[key] as Promise<V | undefined>
      }

      // Normal loading for non-cached items
      const loadPromise = this.loadOne(key).then((result: V | undefined) => {
        if (result) {
          this.set(key, result)
          this.refreshedAtMap[key] = new Date()
        }
        delete this.loading[key]
        this._updateLoadingStatus()
        return result
      }).catch((error) => {
        delete this.loading[key]
        this._updateLoadingStatus()
        throw error
      })

      this.loading[key] = loadPromise
      return loadPromise
    } finally {
      this.isLoading.loadingBy = LoadingState.LOADED
      this.hasLoadedOnce.loadingBy = LoadingState.LOADED
      this._updateLoadingStatus()
    }
  }

  public async getAll(refresh?: boolean): Promise<Record<string, V> | undefined> {
    try {
      this.isLoading.all = LoadingState.LOADING
      this._updateLoadingStatus()

      if (this.loadingAll && !refresh) {
        return this.loadingAll
      }

      if (!refresh && Object.keys(this._map).length > 0) {
        return this._map
      }

      const loadAllPromise = new Promise<Record<string, V> | undefined>(async (resolve) => {
        if (!this.loadAll) {
          throw new Error("Load all items function is not defined")
        }

        try {
          const result = await this.loadAll()
          const processedResult = await this.processLoadResult(result)
          Object.keys(processedResult).forEach((key) => {
            this.refreshedAtMap[key] = new Date()
          })
          resolve(processedResult)
        } catch (error) {
          console.error(error)
          resolve(undefined)
        }
      })

      this.loadingAll = loadAllPromise
      return await loadAllPromise
    } finally {
      this.loadingAll = undefined
      this.isLoading.all = LoadingState.LOADED
      this.hasLoadedOnce.all = LoadingState.LOADED
      this._updateLoadingStatus()
    }
  }

  public async getBy(propName: string, value: any): Promise<V | undefined> {
    try {
      this.isLoading.loadingBy = LoadingState.LOADING
      this._updateLoadingStatus()

      const result = await super.getBy(propName, value)
      if (result) {
        this.refreshedAtMap[result[this.keyProperty]] = new Date()
      }
      return result
    } finally {
      this.isLoading.loadingBy = LoadingState.LOADED
      this.hasLoadedOnce.loadingBy = LoadingState.LOADED
      this._updateLoadingStatus()
    }
  }

  private async processLoadResult(result: V[] | Record<string, V>): Promise<Record<string, V>> {
    if (Array.isArray(result)) {
      result.forEach((item) => {
        if (item) {
          const key = item[this.keyProperty]
          this._map[key] = item
          this.refreshedAtMap[key] = new Date()
        }
      })
    } else {
      Object.entries(result).forEach(([key, value]) => {
        this._map[key] = value
        this.refreshedAtMap[key] = new Date()
      })
    }
    this._updateLoadingStatus()
    return this._map
  }

  public set(key: string, value: V) {
    super.set(key, value)
    this.refreshedAtMap[key] = new Date()
    this._updateLoadingStatus()
    return this
  }

  delete(key: string): boolean {
    if (!super.has(key)) {
      return false
    }

    if (this.refreshedAtMap[key]) {
      delete this.refreshedAtMap[key]
    }
    const result = super.delete(key)
    this._updateLoadingStatus()
    return result
  }

  deleteBy(propName: string, value: any): boolean {
    const result = super.deleteBy(propName, value)
    if (result) {
      delete this.refreshedAtMap[value]
    }
    this._updateLoadingStatus()
    return result
  }

  public clear(): void {
    super.clear()
    this.refreshedAtMap = {}
    this._cachedQueryData = {}
    this._updateLoadingStatus()
  }

  private _updateLoadingStatus() {
    // Update global loading state based on all operations
    const hasAnyLoading =
      Object.values(this.loading).some(val => val === true || val instanceof Promise) ||
      Object.keys(this.loadingQuery).length > 0 ||
      this.loadingAll !== undefined;

    if (hasAnyLoading) {
      this.isLoading.all = LoadingState.LOADING
    } else {
      this.isLoading.all = LoadingState.LOADED
    }

    // Ensure hasLoadedOnce is set properly
    if (this.hasLoadedOnce.all !== LoadingState.LOADED && Object.keys(this._map).length > 0) {
      this.hasLoadedOnce.all = LoadingState.LOADED
    }

    this.emit("updated")
  }
}