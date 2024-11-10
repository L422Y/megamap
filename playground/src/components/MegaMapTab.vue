<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">MegaMap Features</h2>
        <p class="text-sm text-gray-500">Search and filter through items</p>
      </div>
    </div>

    <div class="flex gap-4 mb-6">
      <div class="flex-1">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Search items..."
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div class="w-48">
        <select
            v-model="selectedFilter"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option v-for="opt in filterOptions"
                  :key="opt.value"
                  :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="Object.keys(megaMap.value).length" class="grid grid-cols-2 gap-6">
      <PostCard v-for="item in filteredItems"
                :key="item._id"
                :item="item" />
    </div>
  </div>
</template>

<script setup>
import PostCard from './PostCard.vue'
import { MegaMap } from "megamap"
import { ref, computed, defineModel, onMounted } from "vue"

const megaMap = defineModel("megaMap", { type: MegaMap, required: true })
const searchQuery = ref("")
const selectedFilter = ref("")

const filterOptions = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" }
]

const filteredItems = computed(() => {
  let items = Object.values(megaMap.value.value)

  if (selectedFilter.value) {
    items = items.filter(item => item.status === selectedFilter.value)
  }

  if (searchQuery.value) {
    items = megaMap.value.searchItems(searchQuery.value)
  }

  return items
})

onMounted(() => {
  megaMap.value.getAll()
})
</script>