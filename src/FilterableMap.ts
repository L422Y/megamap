

export class FilterableMap<K, V> extends Map<K, V> {
    // TODO: Implement this
    // private options: FilterableMapOptions<K, V>;
    //
    // constructor(entries?: readonly (readonly [K, V])[] | null, options?: FilterableMapOptions<K, V>) {
    //     super(entries);
    //     this.options = options || {};
    // }
    //
    // filterItems(filterFunc?: (item: V) => boolean): V[] {
    //     const filter = filterFunc || this.options.filter;
    //     if (!filter) return Array.from(this.values());
    //
    //     return Array.from(this.values()).filter(filter);
    // }
    //
    // sortItems(sortFunc?: (item1: V, item2: V) => number): V[] {
    //     const sort = sortFunc || this.options.sort;
    //     if (!sort) return Array.from(this.values());
    //
    //     return this.filterItems().sort(sort);
    // }
    //
    // searchItems(searchTerm: string, fuseOptions?: Fuse.IFuseOptions<V>): V[] {
    //     const items = Array.from(this.values());
    //     if (searchTerm === '') return items;
    //
    //     const fuse = new Fuse(items, { ...fuseOptions, keys: this.options.searchableFields || [] });
    //     return fuse.search(searchTerm).map((result: V) => result);
    // }
    //
    // createSubMap(filterFunc: (item: V) => boolean): Map<K, V> {
    //     const subMap = new Map<K, V>();
    //     for (const [key, value] of this) {
    //         if (filterFunc(value)) {
    //             subMap.set(key, value);
    //         }
    //     }
    //     return subMap;
    // }
    //
    // updateItem(key: K, updateFunc: (item: V) => V): void {
    //     if (this.has(key)) {
    //         const currentItem = this.get(key)!;
    //         const updatedItem = updateFunc(currentItem);
    //         this.set(key, updatedItem);
    //     }
    // }
    //
    // bulkAdd(items: [K, V][]): void {
    //     items.forEach(([key, value]) => {
    //         this.set(key, value);
    //     });
    // }
    //
    // removeIf(filterFunc: (item: V) => boolean): void {
    //     for (const [key, value] of this) {
    //         if (filterFunc(value)) {
    //             this.delete(key);
    //         }
    //     }
    // }
}
