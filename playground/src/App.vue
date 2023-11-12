<template>
  <div>
    <h1>MegaMap Vue Component</h1>

    <fieldset>
      <legend>megaMap</legend>
      <div>
        {{ megaMap.mapRef() }}
      </div>
    </fieldset>

  </div>
</template>

<script setup>


import {MegaMap} from "../../dist/index"
import {triggerRef} from "vue"
import {ref} from "vue"

const megaMap = ref(new MegaMap({
  loadOne: key => Promise.resolve({_id: key, data: `Data for ${key}`, status: "active"}),
  loadAll: () => Promise.resolve([
    {_id: "key1", data: "value1", status: "active"},
    {_id: "key2", data: "value2", status: "inactive"},
    {_id: "key3", data: "value3", status: "inactive"},
    {_id: "key4", data: "value4", status: "draft"},
    {_id: "key5", data: "value5", status: "draft"},
    {_id: "key6", data: "value6", status: "draft"},
    {_id: "key7", data: "value7", status: "draft"},
    {_id: "key8", data: "value8", status: "draft"},
  ]),
  subListFilters: {
    active: (item) => item.status === "active",
    inactive: (item) => item.status === "inactive",
    draft: (item) => item.status === "draft",
  },
  onUpdated: () => {
    triggerRef(megaMap)
  }
}))

</script>

<style scoped>
/* Your component-specific styles go here */
</style>
