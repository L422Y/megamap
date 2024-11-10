# MegaMap

[![wakatime](https://wakatime.com/badge/user/018b859f-13fa-41e2-9883-185549942dff/project/018bbdef-9ad5-44b2-a07f-56a02612b0e9.svg)](https://wakatime.com/badge/user/018b859f-13fa-41e2-9883-185549942dff/project/018bbdef-9ad5-44b2-a07f-56a02612b0e9)
[![npm version](https://badge.fury.io/js/megamap.svg)](https://badge.fury.io/js/megamap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Build Status](https://github.com/l422y/megamap/actions/workflows/main.yml/badge.svg)

MegaMap is a TypeScript library designed for advanced key-value mapping. It extends the native JavaScript `Record` object
and integrates additional features such as caching, loadability, and automatic expiry of entries. MegaMap is built upon
two foundational classes, `LoadableMap` and `CachedLoadableMap`, each offering distinct capabilities. This library is
ideal for sophisticated mapping solutions where enhanced control over data storage and retrieval is needed.

Ideally, this library is meant to be used in conjunction with a data store (e.g. a database, API, etc.),
and/or state management solution, such as [pinia](https://github.com/vuejs/pinia). 

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

## Fake Loaders

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