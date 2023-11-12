<template>
  <div>
    <h1>MegaMap Vue Component</h1>
    <fieldset v-for="(list,key) of megaMap.subLists" :key="key">
      <legend>{{ key.toLocaleUpperCase() }}</legend>
      <div>
        <div v-for="item in list" :key="item._id">
          {{ item.data }}
        </div>
      </div>
    </fieldset>

  </div>
</template>

<script setup>

import {MegaMap} from "megamap"

const megaMap = new MegaMap({
  loadOne: key => Promise.resolve({
    _id: key,
    data: `data: ${key}`,
    status: ["active", "draft", "inactive"][Math.floor(Math.random() * 3)]
  }),
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
  }
})


setInterval(async () => {
  await megaMap.get(`key${Math.floor(Math.random() * 1008) + 1}`)
}, 1000)

</script>

<style scoped>
/* Your component-specific styles go here */
</style>
