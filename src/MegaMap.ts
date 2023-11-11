import { CachedLoadableMap } from "./CachedLoadableMap"

export class MegaMap<K, V> extends CachedLoadableMap<K, V> {
    constructor(load: (key: K) => Promise<V>, loadAll?: () => Promise<Map<K, V>>, expiryInterval?: number) {
        super(load, loadAll, expiryInterval)
    }

    public async get(key: K): Promise<V> {
        const item = await super.get(key)
        if (item === undefined) {
            throw new Error("Item is undefined")
        }
        return item
    }

    public async getAll(): Promise<Map<K, V>> {
        const items = await super.getAll()
        if (!items) {
            throw new Error("No items found")
        }
        return items
    }
}
