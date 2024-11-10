<template>
  <div class="container mx-auto p-4">
    <!-- Header Card -->
    <div class="bg-white rounded-lg shadow mb-8 p-6">
      <h1 class="text-2xl font-bold">MegaMap Playground</h1>
      <p class="text-gray-500">Explore LoadableMap, CachedLoadableMap, MegaMap, and ReactiveMegaMap features</p>
    </div>

    <!-- Tab Navigation -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex -mb-px">
        <button v-for="tab in tabs"
                :key="tab.key"
                @click="activeTab = tab.key"
                :class="[
                  'px-4 py-2 font-medium',
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                ]">
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Map Tabs -->
    <LoadableMapTab v-if="activeTab === 'loadable'" v-model:loadableMap="loadableMap"/>
    <CachedLoadableMapTab v-if="activeTab === 'cached'" v-model:cachedMap="cachedMap"/>
    <MegaMapTab v-if="activeTab === 'mega'" v-model:megaMap="megaMap"/>
    <ReactiveMegaMapTab v-if="activeTab === 'reactive'" v-model:reactiveMap="reactiveMap"/>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { LoadableMap, CachedLoadableMap, MegaMap, ReactiveMegaMap } from "megamap"
import LoadableMapTab from "./components/LoadableMapTab.vue"
import CachedLoadableMapTab from "./components/CachedLoadableMapTab.vue"
import MegaMapTab from "./components/MegaMapTab.vue"
import ReactiveMegaMapTab from "./components/ReactiveMegaMapTab.vue"

// Tab configuration
const activeTab = ref("loadable")
const tabs = [
 {key: "loadable", label: "LoadableMap"},
 {key: "cached", label: "CachedLoadableMap"},
 {key: "mega", label: "MegaMap"},
 {key: "reactive", label: "ReactiveMegaMap"}
]

// Initialize maps
const loadableMap = new LoadableMap({
 loadOne: async (key) => await fetch(`/api/posts/by-id/${key}`).then(res => res.json()),
 loadAll: async () => await fetch("/api/posts").then(res => res.json())
})

const cachedMap = new CachedLoadableMap({
 loadOne: async (key) => await fetch(`/api/posts/by-id/${key}`).then(res => res.json()),
 loadAll: async () => await fetch("/api/posts").then(res => res.json()),
 expiryInterval: 5000 // 5 seconds for demo purposes
})

const megaMap = new MegaMap({
 loadOne: async (key) => await fetch(`/api/posts/by-id/${key}`).then(res => res.json()),
 loadAll: async () => await fetch("/api/posts").then(res => res.json()),
 searchableFields: ["title", "content", "tags"],
 subListFilters: {
  published: (item) => item.status === "published",
  draft: (item) => item.status === "draft"
 }
})

const reactiveMap = new ReactiveMegaMap({
 loadOne: async (key) => await fetch(`/api/posts/by-id/${key}`).then(res => res.json()),
 loadAll: async () => await fetch("/api/posts").then(res => res.json()),
 subListFilters: {
  published: (item) => item.status === "published",
  draft: (item) => item.status === "draft"
 }
})

// Initialize all maps
onMounted(async () => {
 await Promise.all([
  loadableMap.getAll(),
  megaMap.getAll(),
  reactiveMap.getAll()
 ])
})
</script>

<style scoped>
.container {
    max-width: 1200px;
}

pre {
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>