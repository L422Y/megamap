<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">LoadableMap Features</h2>
        <p class="text-sm text-gray-500">Load and display individual items</p>
      </div>
      <div class="flex items-center gap-2">
        <span :class="[
          'px-2 py-1 rounded-full text-sm font-medium',
          loadableMap.isLoading.all ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
        ]">
          {{ loadableMap.isLoading.all ? "Loading..." : "Ready" }}
        </span>
        <button
            :disabled="loadableMap.isLoading.all"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            @click="loadRandomItem"
        >
          Load Random Item
        </button>
      </div>
    </div>

    <div v-if="currentItem" class="mb-6">
      <PostCard :item="currentItem"/>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <h3 class="font-semibold mb-2">Core Features</h3>
        <ul class="space-y-2">
          <li v-for="feature in loadableFeatures"
              :key="feature"
              class="flex items-center gap-2">
            <span class="text-green-500">✓</span>
            {{ feature }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import PostCard from "./PostCard.vue"
import { LoadableMap } from "megamap"
import { ref, onMounted, defineModel } from "vue"

const loadableMap = defineModel("loadableMap", {type: LoadableMap, required: true})
const currentItem = ref(null)

const loadableFeatures = [
 "Async data loading",
 "Single item loading",
 "Bulk loading",
 "Loading state tracking",
 "Error handling"
]

async function loadRandomItem() {
 const randomId = `key${Math.floor(Math.random() * 1000) + 1}`
 currentItem.value = await loadableMap.value.get(randomId)
}

onMounted(() => {
 loadableMap.value.getAll()
})
</script>