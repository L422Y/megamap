import { LoadableMap, LoadableMapOptions } from "./LoadableMap"

type CacheExpiry = {
    expiry: number;
};

export type CachedLoadableMapOptions<K, V> = {
    loadOne: (key: string) => Promise<V | undefined>;
    loadAll?: () => Promise<V[] | Map<string, V>>;
    expiryInterval?: number;
    keyProperty?: string;
} & LoadableMapOptions<K, V>

export class CachedLoadableMap<K, V extends Record<string, any>> extends LoadableMap<string, V> {
    [Symbol.toStringTag]: string = "CachedLoadableMap"
    private expiryCache: Map<string, CacheExpiry> = new Map<string, CacheExpiry>()
    private readonly expiryInterval?: number

    constructor(opts: CachedLoadableMapOptions<string, V>) {
        super(opts)
        this.expiryInterval = opts.expiryInterval
    }

    public async get(key: string): Promise<V | undefined> {
        if (key === undefined) {
            throw new Error("Key is undefined")
        }


        const cacheExpiry = this.expiryCache.get(key)
        const now = Date.now()
        if (cacheExpiry) {
            if (cacheExpiry.expiry === -1 || now < cacheExpiry.expiry) {
                return super.get(key)
            } else {
                this.expiryCache.delete(key)
                this.loadOne(key).then((result: V | undefined) => {
                    if (result) {
                        this.set(key, result)
                    }
                })
            }
        }

        if (this.loading.has(key)) {
            return this.loading.get(key)
        }


        const item = await super.get(key)
        this.setExpiry(key, item)
        return item
    }

    public set(key: string, value: V) {
        super.set(key, value)
        this.setExpiry(key, value)
        return this
    }

    public async getBy(propName: string, value: any): Promise<V | undefined> {
        const result = await super.getBy(propName, value)

        if (result) {
            this.setExpiry(result[this.keyProperty], result)
        }
        return result
    }

    delete(key: string): boolean {
        if (!super.has(key)) {
            return false
        }

        if (this.expiryCache.has(key)) {
            this.expiryCache.delete(key)
        }
        return super.delete(key)
    }

    deleteBy(propName: string, value: any): boolean {
        const result = super.deleteBy(propName, value)
        if (result) {
            this.expiryCache.delete(value)
        }
        return result
    }

    public async getAll(): Promise<Map<string, V> | undefined> {
        const items = await super.getAll()
        if (items) {
            items.forEach((_, key) => {
                this.setExpiry(key, items.get(key))
            })
        }
        return items
    }

    private setExpiry(key: string, value: V | undefined): void {
        if (value !== undefined) {
            this.expiryCache.set(key, {
                expiry: this.expiryInterval ? Date.now() + this.expiryInterval : -1
            })
        }
    }

}
