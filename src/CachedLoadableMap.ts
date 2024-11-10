import { LoadableMap, LoadableMapOptions } from "./LoadableMap"

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
    }

    public async get(key: string): Promise<V | undefined> {
        if (key === undefined) {
            throw new Error("Key is undefined")
        }

        const cacheExpiry = this.refreshedAtMap[key]
        const now = Date.now()
        if (cacheExpiry) {
            if (this.expiryInterval === undefined || now < cacheExpiry.getTime() + this.expiryInterval) {
                return Promise.resolve(super.get(key))
            } else {
                delete this.refreshedAtMap[key]
                this.loadOne(key).then((result: V | undefined) => {
                    if (result) {
                        this.set(key, result)
                    }
                })
            }
        }

        if (this.loading[key]) {
            return this.loading[key]
        }

        const item = await super.get(key)
        this.refreshedAtMap[key] = new Date()
        return item
    }

    public set(key: string, value: V) {
        super.set(key, value)
        this.refreshedAtMap[key] = new Date()
        return this
    }

    public async getBy(propName: string, value: any): Promise<V | undefined> {
        const result = await super.getBy(propName, value)
        if (result) {
            this.refreshedAtMap[result[this.keyProperty]] = new Date()
        }
        return result
    }

    delete(key: string): boolean {
        if (!super.has(key)) {
            return false
        }

        if (this.refreshedAtMap[key]) {
            delete this.refreshedAtMap[key]
        }
        return super.delete(key)
    }

    deleteBy(propName: string, value: any): boolean {
        const result = super.deleteBy(propName, value)
        if (result) {
            delete this.refreshedAtMap[value]
        }
        return result
    }

    public async getAll(refresh?: boolean): Promise<Record<string, V> | undefined> {
        const items = await super.getAll(refresh)
        if (items) {
            Object.keys(items).forEach((key) => {
                this.refreshedAtMap[key] = new Date()
            })
        }
        return items
    }
}