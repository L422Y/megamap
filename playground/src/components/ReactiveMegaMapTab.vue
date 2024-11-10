<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">ReactiveMegaMap Features</h2>
        <p class="text-sm text-gray-500">Reactive updates and filtering</p>
      </div>
      <div class="flex gap-4">
        <button
            @click="updateReactiveItem"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Update Random</span>
        </button>
        <button
            @click="addReactiveItem"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-8">
      <div>
        <div class="flex items-center mb-4">
          <h3 class="font-semibold">Published Items</h3>
          <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            {{ reactiveMap.subLists.published?.length || 0 }}
          </span>
        </div>
        <div class="space-y-4">
          <PostCard v-for="item in publishedItems"
                   :key="item._id"
                   :item="item" />
        </div>
      </div>
      <div>
        <div class="flex items-center mb-4">
          <h3 class="font-semibold">Draft Items</h3>
          <span class="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            {{ reactiveMap.subLists.draft?.length || 0 }}
          </span>
        </div>
        <div class="space-y-4">
          <PostCard v-for="item in draftItems"
                   :key="item._id"
                   :item="item" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ReactiveMegaMap } from "megamap"
import { defineModel, computed } from "vue"
import PostCard from './PostCard.vue'

const reactiveMap = defineModel("reactiveMap", { type: ReactiveMegaMap, required: true })

const publishedItems = computed(() =>
  reactiveMap.value.subLists.published?.filter(item => item && item._id) || []
)

const draftItems = computed(() =>
  reactiveMap.value.subLists.draft?.filter(item => item && item._id) || []
)

function generateNewItem(id) {
  return {
    _id: id,
    title: `New Post ${id}`,
    status: Math.random() > 0.5 ? "published" : "draft",
    content: "This is a new post with some sample content.",
    tags: ["new"],
    author: `Author${Math.floor(Math.random() * 5) + 1}`,
    createdAt: new Date().toISOString()
  }
}

async function updateReactiveItem() {
  const items = Object.values(reactiveMap.value.value)
  if (!items.length) return

  const randomItem = items[Math.floor(Math.random() * items.length)]
  const updatedItem = {
    ...randomItem,
    title: randomItem.title?.includes('Updated:')
      ? randomItem.title
      : `Updated: ${randomItem.title || 'Untitled Post'}`,
    status: randomItem.status === "published" ? "draft" : "published",
    updatedAt: new Date().toISOString()
  }
  reactiveMap.value.set(updatedItem._id, updatedItem)
}

async function addReactiveItem() {
  const newId = `post_${Math.floor(Math.random() * 1000) + 1}`
  const newItem = generateNewItem(newId)
  reactiveMap.value.set(newId, newItem)
}
</script>