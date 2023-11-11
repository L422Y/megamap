import { LoadableMap } from "./LoadableMap"

type CacheItem<V> = {
    value: V | undefined,
    expiry: number
};

export class CachedLoadableMap<K, V> extends LoadableMap<K, V> {
    private cache: Map<K, CacheItem<V | undefined>> = new Map<K, CacheItem<V | undefined>>()

    constructor(
        load: (key: K) => Promise<V | undefined>,
        loadAll?: () => Promise<Map<K, V>>,
        private expiryInterval?: number) {
        super(load, loadAll)
    }

    public async get(key: K): Promise<V | undefined> {
        if (key === undefined) {
            throw new Error("Key is undefined")
        }

        const cacheItem = this.cache.get(key)
        if (cacheItem?.expiry === -1 || cacheItem && ( Date.now() < cacheItem.expiry )) {
            return cacheItem.value
        }

        return super.get(key).then((item: V | undefined) => {
            this.cache.set(key, {
                value: item,
                expiry: this.expiryInterval ? Date.now() + this.expiryInterval : -1
            })
            return item
        })
    }

    public set(key: K, value: V | undefined): void {
        this.cache.set(key, {
            value,
            expiry: this.expiryInterval ? Date.now() + this.expiryInterval : -1
        })
    }

    public async getAll(): Promise<Map<K, V> | undefined> {
        return super.getAll().then((items: Map<K, V> | undefined) => {
            if (items) {
                items.forEach((value, key) => {
                    this.cache.set(key, {
                        value,
                        expiry: this.expiryInterval ? Date.now() + this.expiryInterval : -1
                    })
                })
            }
            return items
        })
    }
}
