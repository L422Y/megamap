
# MegaMap

[![wakatime](https://wakatime.com/badge/user/018b859f-13fa-41e2-9883-185549942dff/project/018bbdef-9ad5-44b2-a07f-56a02612b0e9.svg)](https://wakatime.com/badge/user/018b859f-13fa-41e2-9883-185549942dff/project/018bbdef-9ad5-44b2-a07f-56a02612b0e9)
[![npm version](https://badge.fury.io/js/megamap.svg)](https://badge.fury.io/js/megamap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Build Status](https://github.com/l422y/megamap/actions/workflows/main.yml/badge.svg)


MegaMap is a TypeScript library designed for advanced key-value mapping. It extends the native JavaScript `Map` object and integrates additional features such as caching, loadability, and automatic expiry of entries. MegaMap is built upon two foundational classes, `LoadableMap` and `CachedLoadableMap`, each offering distinct capabilities. This library is ideal for sophisticated mapping solutions where enhanced control over data storage and retrieval is needed.


## Features

MegaMap provides a suite of TypeScript classes for advanced key-value mapping, each offering unique capabilities:

1. **LoadableMap**: This class extends basic map functionality with dynamic loading capabilities. Key features include:
    - Asynchronous data loading for individual keys (`loadOne`).
    - Optional bulk data loading (`loadAll`).
    - Custom key properties (`keyProperty`) for complex data types.
    - Callbacks for map updates (`onUpdated`).

2. **CachedLoadableMap**: Building on LoadableMap, this class adds caching features with automatic expiry. It includes:
    - All LoadableMap features.
    - Configurable expiry intervals for cached data (`expiryInterval`).

3. **MegaMap**: This is a comprehensive class combining loading, caching, and advanced manipulation. It includes:
    - All CachedLoadableMap features.
    - Support for secondary maps (`secondaryMaps`) for additional organizational capabilities.
    - Customizable item filters (`filter`).
    - Integration with Fuse.js for advanced search capabilities.

4. **ReactiveMegaMap**: A specialized version of MegaMap designed for reactive frameworks like Vue.js. It offers:
    - All MegaMap features.
    - Reactive map properties, enabling seamless integration with reactive UI components.

## Installation

```bash
npm install megamap
```


## Usage

For these examples, we will set up some fake data loader functions:

```typescript
// define a type for our fake data
type TFakePost = {
   _id: string,
   data: string,
   status: "active" | "draft" | "inactive"
}

// load a single record by key
const fakeRecordLoad = async (key: string) => Promise.resolve<TFakePost>({
   _id: key,
   data: `data: ${key}`,
   status: ["active", "draft", "inactive"][Math.floor(Math.random() * 3)]
})

// load all records
const fakeMultipleRecordLoad = async () => () => Promise.resolve<TFakePost[]>([
   {_id: "key1", data: "value1", status: "active"},
   {_id: "key2", data: "value2", status: "inactive"},
   {_id: "key3", data: "value3", status: "inactive"},
   {_id: "key4", data: "value4", status: "draft"},
   {_id: "key5", data: "value5", status: "draft"},
   {_id: "key6", data: "value6", status: "draft"},
   {_id: "key7", data: "value7", status: "draft"},
   {_id: "key8", data: "value8", status: "draft"},
])

```

### Sub-lists / Filters
...and some filters that will be used in the `subListFilters` option to populate the `subLists` property of our MegaMap:

```typescript
const subListFilters = {
   active: (item: any) => item.status === "active",
   draft: (item: any) => item.status === "draft",
   inactive: (item: any) => item.status === "inactive",
}
```   

We'll refer to these functions in the examples below.

### `MegaMap`/`ReactiveMegaMap` Classes

Currently, these two classes are almost identical. The only difference is that `ReactiveMegaMap` uses Vue `reactive` properties, which enables reactivity for the sub-lists inside components/templates.

For `MegaMap`:
```typescript
import { MegaMap } from 'megamap';

const megaMap = new MegaMap({
   loadOne: fakeRecordLoad, // see above
   loadAll: fakeMultipleRecordLoad, // see above,
   subListFilters, // see above
   onUpdated: (updatedItem) => {
      console.log(`Updated item: ${updatedItem._id}`)
   }
})

// simulate a record load every second
setInterval(async () => {
   await megaMap.get(`key${Math.floor(Math.random() * 1008) + 1}`)
}, 1000)

```

and for `ReactiveMegaMap` in Vue:

```vue
<template>
    <fieldset>
      <legend>ACTIVE</legend>
      <div>
        <div v-for="item in megaMap.subLists.active" :key="item._id">
          {{ item.data }}
        </div>
      </div>
    </fieldset>
</template>
<script setup>

import {ReactiveMegaMap} from "megamap"

const megaMap = new ReactiveMegaMap({
  loadOne: fakeRecordLoad, // see above
  loadAll: fakeMultipleRecordLoad, // see above,
  subListFilters // see above
})

// simulate a record load every second
setInterval(async () => {
  await megaMap.get(`key${Math.floor(Math.random() * 1008) + 1}`)
}, 1000)

</script>
```



## Additional Classes

You can also utilize the following classes independently of MegaMap:

### `LoadableMap` Class

```typescript
import { LoadableMap } from 'megamap';

// Define asynchronous loading function
const loadFunction = async (key: string) => {
    // Fetch data for a specific key
};

const loadableMap = new LoadableMap<string, DataType>(loadFunction);
```

### `CachedLoadableMap` Class

```typescript
import { CachedLoadableMap } from 'megamap';

const cachedMap = new CachedLoadableMap<string, DataType>(loadFunction, 60000);
```


## Contributing

Contributions to MegaMap are welcome. Please feel free to submit pull requests or suggest features.

## License

This project is licensed under the MIT License.
