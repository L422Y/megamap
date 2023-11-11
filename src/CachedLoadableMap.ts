import { LoadableMap } from "./LoadableMap"

type CacheExpiry = {
    expiry: number;
};

type CachedLoadableMapOptions<K, V> = {
    loadOne: (key: K) => Promise<V | undefined>;
    loadAll?: () => Promise<V[] | Map<K, V>>;
    expiryInterval?: number;
    keyProperty?: keyof V;
};

export class CachedLoadableMap<K, V extends Record<string, any>> extends LoadableMap<K, V> {
    private expiryCache: Map<K, CacheExpiry> = new Map<K, CacheExpiry>()
    private readonly expiryInterval?: number

    constructor({loadOne, loadAll, expiryInterval, keyProperty = "_id" as keyof V}: CachedLoadableMapOptions<K, V>) {
        super({loadOne, loadAll, keyProperty})
        this.expiryInterval = expiryInterval
    }

    public async get(key: K): Promise<V | undefined> {
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

    public set(key: K, value: V) {
        super.set(key, value)
        this.setExpiry(key, value)
        return this
    }

    public async getAll(): Promise<Map<K, V> | undefined> {
        const items = await super.getAll()
        if (items) {
            items.forEach((_, key) => {
                this.setExpiry(key, items.get(key))
            })
        }
        return items
    }

    private setExpiry(key: K, value: V | undefined): void {
        if (value !== undefined) {
            this.expiryCache.set(key, {
                expiry: this.expiryInterval ? Date.now() + this.expiryInterval : -1
            })
        }
    }

}
