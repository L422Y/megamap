export class LoadableMap<K, V> {
    protected loading: Map<K, Promise<V | undefined>> = new Map<K, Promise<V | undefined>>()
    protected loadingAll: Promise<Map<K, V> | undefined> | undefined
    private loadItem: (key: K) => Promise<V | undefined>
    private loadAllItems?: () => Promise<Map<K, V>>

    constructor(load: (key: K) => Promise<V | undefined>, loadAll?: () => Promise<Map<K, V>>) {
        this.loadItem = load
        this.loadAllItems = loadAll
    }

    public async get(key: K): Promise<V | undefined> {
        if (key === undefined) {
            throw new Error("Key is undefined")
        }

        if (this.loading.has(key)) {
            return this.loading.get(key)
        }

        const loadPromise = this.loadItem(key)
            .then((item: V | undefined) => {
                this.loading.delete(key)
                return item
            }).catch((error) => {
                this.loading.delete(key)
                throw error
            })

        this.loading.set(key, loadPromise)

        return loadPromise
    }

    public async getAll(): Promise<Map<K, V> | undefined> {
        if (!this.loadAllItems) {
            throw new Error("Load all items function is not defined")
        }

        if (this.loadingAll) {
            return this.loadingAll
        }

        this.loadingAll = this.loadAllItems()
            .then((items: Map<K, V>) => {
                this.loadingAll = undefined
                return items
            }).catch((error) => {
                this.loadingAll = undefined
                throw error
            })

        return this.loadingAll
    }
}
