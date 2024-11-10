export type CacheItem<V> = {
    value: V,
    expiry: number
}

export type FilterableMapOptions<K, V> = {
    filter?: (item: V) => boolean;
    sort?: (item1: V, item2: V) => number;
    searchableFields?: ( keyof V )[];
}


export * from "./CachedLoadableMap"
export * from "./LoadableMap"
export * from "./MegaMap"
export * from "./ReactiveMegaMap"
