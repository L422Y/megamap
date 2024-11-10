<template>
  <div class="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div class="p-4">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-lg font-semibold text-gray-800">
          {{ formatTitle(item.title) }}
        </h3>
        <span :class="[
          'px-2 py-1 text-xs font-medium rounded-full',
          statusStyles[item.status] || 'bg-gray-100 text-gray-800'
        ]">
          {{ item.status || "unknown" }}
        </span>
      </div>

      <p v-if="item.content" class="text-gray-600 text-sm mb-3 line-clamp-3">
        {{ item.content }}
      </p>

      <div v-if="item.tags?.length" class="flex flex-wrap gap-2 mb-3">
        <span v-for="tag in item.tags"
              :key="tag"
              class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
          {{ tag }}
        </span>
      </div>

      <div class="flex flex-wrap gap-4 text-xs text-gray-500">
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
          </svg>
          {{ item._id }}
        </span>
        <span v-if="item.author" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          {{ item.author }}
        </span>
        <span v-if="formattedDate" class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          {{ formattedDate }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from "vue"

const props = defineProps({
 item: {
  type: Object,
  required: true
 }
})

const statusStyles = {
 published: "bg-green-100 text-green-800",
 draft: "bg-yellow-100 text-yellow-800",
 deleted: "bg-red-100 text-red-800"
}

const formattedDate = computed(() => {
 const date = props.item.updatedAt || props.item.createdAt
 if (!date) return ""
 try {
  return new Date(date).toLocaleDateString(undefined, {
   year: "numeric",
   month: "short",
   day: "numeric"
  })
 } catch (e) {
  return ""
 }
})

function formatTitle(title) {
 if (!title) return "Untitled Post"
 // Remove redundant "Updated:" prefixes
 return title.replace(/^(Updated: )+/g, "Updated: ")
}
</script>