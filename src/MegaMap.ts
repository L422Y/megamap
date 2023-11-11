import { CachedLoadableMap } from "./CachedLoadableMap"


interface MegaMapOptions<K, V> {
    loadOne: (key: K) => Promise<V | undefined>,
    loadAll?: () => Promise<Map<K, V> | V[]>,
    expiryInterval?: number
    keyProperty?: keyof V
}

export class MegaMap<K, V extends Record<string, any>> extends CachedLoadableMap<K, V> {
    private secondaryMaps: Array<MegaMap<any, any>> = []

    constructor({loadOne, loadAll, expiryInterval, keyProperty = "_id" as keyof V}: MegaMapOptions<K, V>) {
        super({loadOne, loadAll, expiryInterval, keyProperty})
        this.keyProperty = keyProperty as keyof V || "_id" as keyof V
    }

    public get size(): number {
        return super.size
    }

    public async get(key: K): Promise<V | undefined> {
        const value = await super.get(key)
        this.secondaryMaps.forEach(map => map.set(key, value))
        return value
    }

    public async getAll(): Promise<Map<K, V>> {
        const items = await super.getAll()
        if (!items) {
            throw new Error("No items found")
        }

        return items
    }

    public async bulkAdd(items: V[]): Promise<void> {
        items.forEach(item => {
            this.set(item[this.keyProperty], item)
        })
        this.secondaryMaps.forEach(map => map.bulkAdd(items))
    }

    public async addSecondaryMap(map: MegaMap<any, any>) {
        this.secondaryMaps.push(map)
        await map.bulkAdd(Array.from(this._map.values()))
    }

}
