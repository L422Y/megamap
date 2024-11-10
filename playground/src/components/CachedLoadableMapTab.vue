<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center gap-2 mb-4">
      <h2 class="text-xl font-semibold">CachedLoadableMap Features</h2>
    </div>

    <div class="space-y-4">
      <!-- Controls -->
      <div class="flex items-center gap-2">
        <button
          @click="loadCachedItem"
          :disabled="cachedMap.isLoading.all"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Load Random Item
        </button>
        <button
          @click="loadSameItem"
          :disabled="!currentItem"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Reload Same Item
        </button>
        <button
          @click="clearCache"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Cache
        </button>
        <div class="text-sm text-gray-500">
          Cache Size: {{ Object.keys(cachedMap.value).length }} items
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Current Item Display -->
        <div class="space-y-2">
          <h3 class="font-semibold">Current Item</h3>
          <div v-if="currentItem" class="p-4 bg-gray-50 rounded">
            <div class="flex justify-between mb-2 text-sm">
              <span :class="[
                'px-2 py-1 rounded-full font-medium',
                lastRequestType === 'cache' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              ]">
                {{ lastRequestType === 'cache' ? 'Cache Hit' : 'Network Request' }}
              </span>
              <span class="text-gray-500">
                Time: {{ lastRequestTime }}ms
              </span>
            </div>
            <div v-if="getCacheExpiryTime() > 0" class="mb-2 text-sm text-gray-500">
              Cache expires in: {{ getCacheExpiryTime() }}s
            </div>
            <pre class="text-sm">{{ JSON.stringify(currentItem, null, 2) }}</pre>
          </div>
        </div>

        <!-- Request History -->
        <div class="space-y-2">
          <h3 class="font-semibold">Request History</h3>
          <div class="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
            <div v-for="(request, index) in requestHistory"
                 :key="index"
                 class="mb-2 p-2 border-b border-gray-200 last:border-0">
              <div class="flex justify-between items-center mb-1">
                <span :class="[
                  'px-2 py-0.5 rounded-full text-sm font-medium',
                  request.type === 'cache' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                ]">
                  {{ request.type === 'cache' ? 'Cache Hit' : 'Network Request' }}
                </span>
                <span class="text-sm text-gray-500">
                  {{ request.time }}ms
                </span>
              </div>
              <div class="text-sm text-gray-600">
                ID: {{ request.itemId }}
              </div>
              <div class="text-xs text-gray-500">
                {{ new Date(request.timestamp).toLocaleTimeString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CachedLoadableMap } from "megamap"
import { ref, onMounted, defineModel } from "vue"

const cachedMap = defineModel("cachedMap", {
  type: CachedLoadableMap,
  required: true
})

const currentItem = ref(null)
const lastRequestTime = ref(0)
const lastRequestType = ref(null)
const requestHistory = ref([])

async function loadCachedItem() {
  const randomId = `key${Math.floor(Math.random() * 50) + 1}`
  await loadItem(randomId)
}

async function loadSameItem() {
  if (currentItem.value) {
    await loadItem(currentItem.value._id)
  }
}

async function loadItem(itemId) {
  const startTime = performance.now()

  // Check if item exists in cache and isn't expired before loading
  const cacheExpiry = cachedMap.value.getRefreshedAt(itemId)
  const now = Date.now()
  const isInCache = cacheExpiry && (now < cacheExpiry.getTime() + 5000)

  const result = await cachedMap.value.get(itemId)
  const requestTime = Math.round(performance.now() - startTime)

  // Update current state
  currentItem.value = result
  lastRequestTime.value = requestTime
  lastRequestType.value = isInCache ? 'cache' : 'network'

  // Add to history
  requestHistory.value.unshift({
    itemId,
    type: isInCache ? 'cache' : 'network',
    time: requestTime,
    timestamp: Date.now()
  })

  // Keep history at a reasonable size
  if (requestHistory.value.length > 10) {
    requestHistory.value.pop()
  }
}

function clearCache() {
  cachedMap.value.clear()
  requestHistory.value = []
  currentItem.value = null
  lastRequestTime.value = 0
  lastRequestType.value = null
}

function getCacheExpiryTime() {
 if (!currentItem.value?._id) return 0
 const refreshedAt = cachedMap.value.getRefreshedAt(currentItem.value._id)
 if (!refreshedAt) return 0
 return Math.max(0, Math.ceil((refreshedAt.getTime() + 5000 - Date.now()) / 1000))
}

onMounted(() => {
 cachedMap.value.getAll()
})
</script>

<style scoped>
pre {
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>