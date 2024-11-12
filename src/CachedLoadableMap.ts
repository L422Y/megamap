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

  // Track loading states separately from promises
  protected loadingStates: Record<string, boolean> = {}
  // Override loading property from base class
  protected override loading: Record<string, Promise<V | undefined>> = {}

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

  // Public method to check if item is loading
  public isItemLoading(key: string): boolean {
    return this.loadingStates[key] || false
  }

  async executeCachedQuery(queryName: string, ...args: any[]): Promise<V | V[]> {
    const queryKey = `${queryName}:${args.join(":")}`

    try {
      this.loadingStates[queryKey] = true
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
      })

      this.loadingQuery[queryKey] = promise
      return promise
    } finally {
      delete this.loadingStates[queryKey]
      this.isLoading.loadingQuery = LoadingState.LOADED
      this.hasLoadedOnce.loadingQuery = LoadingState.LOADED
      this.updateLoadingStatus()
    }
  }

  public override async get(key: string): Promise<V | undefined> {
    if (key === undefined) {
      throw new Error("Key is undefined")
    }

    try {
      this.loadingStates[key] = true
      this.isLoading.loadingBy = LoadingState.LOADING
      this.updateLoadingStatus()

      const cacheExpiry = this.refreshedAtMap[key]
      const now = Date.now()

      // If we have a cached item, check if it's expired
      if (this._map[key] && cacheExpiry) {
        if (this.expiryInterval === undefined || now < cacheExpiry.getTime() + this.expiryInterval) {
          delete this.loadingStates[key]
          return this._map[key]
        }
      }

      // Create and store the loading promise
      const loadPromise = this.loadOne(key).then((result: V | undefined) => {
        if (result) {
          this.set(key, result)
          this.refreshedAtMap[key] = new Date()
        }
        return result
      })

      this.loading[key] = loadPromise
      return await loadPromise
    } finally {
      delete this.loadingStates[key]
      delete this.loading[key]
      this.isLoading.loadingBy = LoadingState.LOADED
      this.hasLoadedOnce.loadingBy = LoadingState.LOADED
      this.updateLoadingStatus()
    }
  }

  public override async getAll(refresh?: boolean): Promise<Record<string, V> | undefined> {
    try {
      this.isLoading.all = LoadingState.LOADING
      this.updateLoadingStatus()

      if (!refresh && Object.keys(this._map).length > 0) {
        return this._map
      }

      const result = await super.getAll(refresh)
      if (result) {
        Object.keys(result).forEach(key => {
          this.refreshedAtMap[key] = new Date()
        })
      }
      return result
    } finally {
      this.isLoading.all = LoadingState.LOADED
      this.hasLoadedOnce.all = LoadingState.LOADED
      this.updateLoadingStatus()
    }
  }

  public override async getBy(propName: string, value: any): Promise<V | undefined> {
    try {
      this.loadingStates[`by:${propName}:${value}`] = true
      this.isLoading.loadingBy = LoadingState.LOADING
      this.updateLoadingStatus()

      const result = await super.getBy(propName, value)
      if (result) {
        this.refreshedAtMap[result[this.keyProperty]] = new Date()
      }
      return result
    } finally {
      delete this.loadingStates[`by:${propName}:${value}`]
      this.isLoading.loadingBy = LoadingState.LOADED
      this.hasLoadedOnce.loadingBy = LoadingState.LOADED
      this.updateLoadingStatus()
    }
  }

  public override set(key: string, value: V): this {
    if (value === undefined) {
      return this
    }

    super.set(key, value)
    this.refreshedAtMap[key] = new Date()
    this.updateLoadingStatus()
    return this
  }

  public override delete(key: string): boolean {
    const hadKey = super.delete(key)
    if (hadKey) {
      delete this.refreshedAtMap[key]
      delete this.loadingStates[key]
      this.updateLoadingStatus()
    }
    return hadKey
  }

  public override deleteBy(propName: string, value: any): boolean {
    const item = Object.values(this._map).find(item => item[propName] === value)
    if (item) {
      const key = item[this.keyProperty]
      return this.delete(key)
    }
    return false
  }

  public override clear(): void {
    super.clear()
    this.refreshedAtMap = {}
    this._cachedQueryData = {}
    this.loadingStates = {}
    this.updateLoadingStatus()
  }

  private updateLoadingStatus(): void {
    const hasAnyLoading = Object.values(this.loadingStates).some(Boolean)

    if (hasAnyLoading) {
      this.isLoading.all = LoadingState.LOADING
    } else {
      this.isLoading.all = LoadingState.LOADED
    }

    if (Object.keys(this._map).length > 0) {
      this.hasLoadedOnce.all = LoadingState.LOADED
    }

    this.emit("updated")
  }
}