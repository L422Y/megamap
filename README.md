# MegaMap

> A TypeScript-first map implementation that handles loading, caching, searching, filtering, and reactivity.

[![wakatime](https://wakatime.com/badge/user/018b859f-13fa-41e2-9883-185549942dff/project/018bbdef-9ad5-44b2-a07f-56a02612b0e9.svg)](https://wakatime.com/badge/user/018b859f-13fa-41e2-9883-185549942dff/project/018bbdef-9ad5-44b2-a07f-56a02612b0e9)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Build Status](https://github.com/l422y/megamap/actions/workflows/main.yml/badge.svg)


MegaMap is a TypeScript library designed for advanced key-value mapping. It extends the native JavaScript `Record` object
and integrates additional features such as caching, loadability, and automatic expiry of entries. MegaMap is built upon
two foundational classes, `LoadableMap` and `CachedLoadableMap`, each offering distinct capabilities. This library is
ideal for sophisticated mapping solutions where enhanced control over data storage and retrieval is needed.

Ideally, this library is meant to be used in conjunction with a data store (e.g. a database, API, etc.),
and/or state management solution, such as [pinia](https://github.com/vuejs/pinia). 

## Demo

I've started creating a demo on usage of the library, you can find the source at [megamap-demo](https://github.com/l422y/megamap-demo)

There's a live demo at [megamap-demo.pages.dev](https://megamap-demo.pages.dev/)

## Quick Example

```typescript
import { MegaMap, ReactiveMegaMap } from 'megamap'

// Basic loading and caching
const posts = new MegaMap({
  loadOne: (id) => fetch(`/api/posts/${id}`).then(r => r.json()),
  loadAll: () => fetch('/api/posts').then(r => r.json()),
  expiryInterval: 5000, // Cache expires after 5 seconds
})

// Load and cache automatically
await posts.get('123')  // Fetches from API
await posts.get('123')  // Returns from cache
await posts.get('123')  // After 5s, fetches fresh data

// Enable search functionality
const searchablePosts = new MegaMap({
  ...postsConfig,
  searchableFields: ['title', 'content', 'tags']
})

// Fuzzy search across all loaded items
const results = searchablePosts.searchItems('typescript')

// Maintain filtered sublists automatically
const organizedPosts = new MegaMap({
  ...postsConfig,
  subListFilters: {
    published: post => post.status === 'published',
    draft: post => post.status === 'draft',
    recent: post => isWithinLast7Days(post.date)
  }
})

// Access filtered lists
console.log(organizedPosts.subLists.published)  // Array of published posts
console.log(organizedPosts.subLists.draft)     // Array of drafts
console.log(organizedPosts.subLists.recent)    // Recent posts

// Make it reactive (Vue.js)
const reactivePosts = new ReactiveMegaMap({
  loadOne: (id) => fetch(`/api/posts/${id}`).then(r => r.json()),
  loadAll: () => fetch('/api/posts').then(r => r.json()),
  subListFilters: {
    published: post => post.status === 'published',
    draft: post => post.status === 'draft'
  }
})

// Now it's Vue reactive - changes trigger component updates
reactivePosts.set('123', { title: 'Updated' })
```

## Vue.js Example

```vue
<!-- PostManager.vue -->
<template>
  <div class="space-y-4">
    <!-- Search -->
    <input v-model="search" placeholder="Search posts..." />
    
    <!-- Posts Lists -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <h2>Published ({{ postsMap.subLists.published.length }})</h2>
        <div v-for="post in postsMap.subLists.published" :key="post.id">
          {{ post.title }}
        </div>
      </div>
      <div>
        <h2>Drafts ({{ postsMap.subLists.draft.length }})</h2>
        <div v-for="post in postsMap.subLists.draft" :key="post.id">
          {{ post.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ReactiveMegaMap } from 'megamap'

interface Post {
  id: string
  title: string
  status: 'draft' | 'published'
}

const search = ref('')
const postsMap = new ReactiveMegaMap<string, Post>({
  loadOne: (id) => fetch(`/api/posts/${id}`).then(r => r.json()),
  loadAll: () => fetch('/api/posts').then(r => r.json()),
  searchableFields: ['title'],
  subListFilters: {
    published: post => post.status === 'published',
    draft: post => post.status === 'draft'
  }
})

onMounted(() => postsMap.getAll())

// Update a post - UI automatically updates
const publishPost = (id: string) => {
  postsMap.set(id, { ...postsMap.value[id], status: 'published' })
}
</script>
```

This example shows:
- 🔄 Automatic reactive sublists
- 🔍 Built-in search
- ⚡️ TypeScript support
- 📱 Simple grid layout

## Features

TL;DR:

- 🚀 Automatic loading & caching
- 🔍 Built-in fuzzy search (via Fuse.js)
- 🔄 Auto-maintained filtered lists
- ⚡️ Vue.js reactivity (via ReactiveMegaMap)
- 📦 TypeScript-first

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

In the examples below we are implementing things outside of state management, and in
a vue template directly. This is not recommended for production use, but is done here for the sake of simplicity. We are also using some fake data loader functions, [check those out here](FAKELOADERS.md).
### Named Queries

We'll also set up some named queries, these are basically stored functions that can be called on the MegaMap instance,
allowing you to easily retrieve data from the map without having to write the same code over and over again.

The format is meant to be clean and simple, so that you can easily read and understand what the query is doing.

```typescript
 const namedQueries = {
    byAuthor: async (authorId) => {
        return fetch(`/api/posts/by-author/${authorId}`).then(res => res.json())
    },
    byTag: async (tag) => {
        return fetch(`/api/posts/by-tag/${tag}`).then(res => res.json())
    },
}
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

Currently, these two classes are almost identical. The only difference is that `ReactiveMegaMap` uses Vue `reactive`
properties, which enables reactivity for the sub-lists inside components/templates.

For `MegaMap`:

```typescript
import { MegaMap } from "megamap"

// create a new MegaMap
const allPosts = new MegaMap({
    loadOne: fakeRecordLoad, // see above
    loadAll: fakeMultipleRecordLoad, // see above,
    subListFilters, // see above
    namedQueries, // see above
})

// another MegaMap that will be populated with user's "posts"
const myPosts = MegaMap({
    loadOne: fakeRecordLoad, // see above
    loadAll: fakeMultipleRecordLoad, // see above,
    subListFilters, // see above
    secondaryMaps: [allPosts] // see below
   
})

// simulate a record load every second
setInterval(async () => {
    await megaMap.get(`key${Math.floor(Math.random() * 1000) + 1}`)
}, 1000)

```

The `MegaMap` class has a `secondaryMaps` option that allows you to specify other MegaMaps that new items should be
added to. This is useful for creating multiple views of the same data, for example, a "My Posts" view and an "All Posts"

This way, when a new item is loaded into `myPosts`, it will also be added to `allPosts`.

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
      subListFilters, // see above
      namedQueries, // see above
   })

   // using the predefined named queries
   const authorPosts = ref(await megaMap.query.byAuthor("00001"))
   const taggedPosts = ref(await megaMap.query.byTag("fake"))

   // simulate a record load every second
   setInterval(async () => {
      await megaMap.get(`key${Math.floor(Math.random() * 1008) + 1}`)
   }, 1000)

</script>
```

## Additional Classes

You can also utilize the following classes independently of MegaMap:

### `LoadableMap` Class

This class extends the native JavaScript `Record` object with dynamic loading capabilities. It does not include any of the
advanced features of `CachedLoadableMap` or `MegaMap`, but is useful for loading data into maps instead of handling this
manually.

```typescript
import { LoadableMap } from "megamap"

const loadableMap = new LoadableMap<string, TFakePost>({
    loadOne: fakeRecordLoad, // see above
    loadAll: fakeMultipleRecordLoad, // see above,
    keyProperty: "_id", // default is "_id"
    onUpdated: (updatedItem) => {
        console.log(`Updated item: ${updatedItem.id}`)
    }
})
```

### `CachedLoadableMap` Class

Adds caching and expiry features to `LoadableMap`, will automatically expire cached items after the specified interval,
so that they will be reloaded on the next access.

This class is useful for caching data that is accessed often, but not expected to change frequently, but may need to be
refreshed.

```typescript
import { CachedLoadableMap } from 'megamap';

const cachedMap = new CachedLoadableMap<string, DataType>({
    loadOne: fakeRecordLoad, // see above
    loadAll: fakeMultipleRecordLoad, // see above,
    keyProperty: "_id", // default is "_id"
    expiryInterval: 1000 * 60 * 60 * 24, // 24 hours
    onUpdated: (updatedItem) => {
        console.log(`Updated item: ${updatedItem.id}`)
    }
});
```

## Contributing

Contributions to MegaMap are welcome. Please feel free to submit pull requests or suggest features.

## License

This project is licensed under the MIT License.
