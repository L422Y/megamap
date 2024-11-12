<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center gap-2 mb-4">
      <h2 class="text-xl font-semibold">CachedLoadableMap Demo</h2>
    </div>

    <div class="flex h-[500px] gap-4">
      <!-- List Panel -->
      <div class="w-1/3 border rounded-lg overflow-hidden">
        <div class="p-4 bg-gray-50 border-b">
          <h3 class="font-medium">Posts</h3>
          <p class="text-sm text-gray-500">Cache expires after 5 seconds</p>
          <div class="mt-2">
            <span :class="[
              'px-2 py-1 rounded-full text-sm font-medium',
              cachedMap.isLoading.all === LoadingState.LOADING ? 'bg-yellow-100 text-yellow-800' :
              cachedMap.hasLoadedOnce.all === LoadingState.LOADED ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            ]">
              {{ getLoadingStateText(cachedMap.isLoading.all) }}
            </span>
          </div>
        </div>
        <div class="overflow-y-auto h-[calc(100%-6rem)]">
          <div v-for="id in postIds"
               :key="id"
               :class="[
                 'p-4 border-b cursor-pointer hover:bg-gray-50',
                 selectedId === id ? 'bg-blue-50' : ''
               ]"
               @click="selectPost(id)">
            <div class="flex justify-between items-center">
              <div class="font-medium">Post {{ id }}</div>
              <span v-if="cachedMap.loading[id]"
                    class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                Updating...
              </span>
            </div>
            <div class="text-sm text-gray-500">
              {{ getCacheStatus(id) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Detail Panel -->
      <div class="flex-1 border rounded-lg overflow-hidden">
        <div class="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 class="font-medium">Post Details</h3>
          <div class="flex items-center gap-2">
<!--            &lt;!&ndash; Global Loading State &ndash;&gt;-->
<!--            <span :class="[-->
<!--              'px-2 py-1 rounded-full text-sm font-medium',-->
<!--              cachedMap.isLoading.all === LoadingState.LOADING ? 'bg-yellow-100 text-yellow-800' :-->
<!--              cachedMap.hasLoadedOnce.all === LoadingState.LOADED ? 'bg-green-100 text-green-800' :-->
<!--              'bg-gray-100 text-gray-800'-->
<!--            ]">-->
<!--              {{ getLoadingStateText(cachedMap.isLoading.all) }}-->
<!--            </span>-->

            <!-- Individual Item Loading State -->
            <template v-if="selectedId">
              <span :class="[
                'px-2 py-1 rounded-full text-sm font-medium',
                cachedMap.loading[selectedId] ? 'bg-yellow-100 text-yellow-800' :
                currentItem ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              ]">
                {{
                  cachedMap.loading[selectedId] ? "Updating..." :
                      currentItem ? "Loaded" : "Not Loaded"
                }}
              </span>

              <!-- Cache Status -->
              <span v-if="currentItem" class="text-sm text-gray-500">
                <template v-if="expiryTime > 0">
                  Expires in: {{ expiryTime }}s
                </template>
                <template v-else>
                  Expired (will refresh on next access)
                </template>
              </span>
            </template>
          </div>
        </div>

        <div v-if="currentItem" class="p-4">
          <pre class="whitespace-pre-wrap">{{ JSON.stringify(currentItem, null, 2) }}</pre>
        </div>
        <div v-else-if="cachedMap.loading[selectedId]" class="p-4 text-gray-500">
          Loading post details...
        </div>
        <div v-else class="p-4 text-gray-500">
          Select a post to view details
        </div>
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <button
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          @click="clearCache"
      >
        Clear Cache
      </button>
      <button
          :disabled="!selectedId || cachedMap.loading[selectedId]"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          @click="refreshCurrentItem"
      >
        Force Refresh
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineModel, computed } from "vue"
import { LoadingState } from "megamap"

const cachedMap = defineModel("cachedMap", {required: true})
const currentItem = ref(null)
const selectedId = ref(null)
const now = ref(Date.now())

// Generate a list of post IDs
const postIds = computed(() =>
  Array.from({length: 10}, (_, i) => `key${i + 1}`)
)

function getLoadingStateText(state) {
 switch (state) {
  case LoadingState.LOADING:
   return "Updating..."
  case LoadingState.LOADED:
   return "Loaded"
  case LoadingState.NOT_LOADED:
   return "Not Loaded"
  default:
   return "Unknown"
 }
}

function getCacheStatus(id) {
 const refreshedAt = cachedMap.value.getRefreshedAt(id)
 if (!refreshedAt) return "Not cached"
 return `Cached at ${refreshedAt.toLocaleTimeString()}`
}

async function selectPost(id) {
 selectedId.value = id
 try {
  currentItem.value = await cachedMap.value.get(id)
 } catch (error) {
  console.error("Error loading post:", error)
  currentItem.value = null
 }
}

async function refreshCurrentItem() {
 if (selectedId.value && !cachedMap.value.loading[selectedId.value]) {
  cachedMap.value.delete(selectedId.value)
  await selectPost(selectedId.value)
 }
}

function clearCache() {
 cachedMap.value.clear()
 currentItem.value = null
}

const expiryTime = computed(() => {
 if (!currentItem.value?._id) return 0
 const refreshedAt = cachedMap.value.getRefreshedAt(currentItem.value._id)
 if (!refreshedAt) return 0
 return Math.max(0, Math.ceil((refreshedAt.getTime() + 5000 - now.value) / 1000))
})

// Set up timer for cache expiry countdown
let interval
onMounted(() => {
 // Initialize data
 cachedMap.value.getAll()

 // Start the countdown timer
 interval = setInterval(() => {
  now.value = Date.now()
 }, 1000)
})

onUnmounted(() => {
 if (interval) {
  clearInterval(interval)
 }
})
</script>