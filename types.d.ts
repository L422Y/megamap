type CacheItem<V> = {
    value: V,
    expiry: number
}

type FilterableMapOptions<K, V> = {
    filter?: (item: V) => boolean;
    sort?: (item1: V, item2: V) => number;
    searchableFields?: ( keyof V )[];
}
