<template>
  <template v-if="megaMap.subLists">
    <h1>MegaMap</h1>

    <fieldset>
      <legend>ACTIVE</legend>
      <div>
        <div v-for="item in megaMap.subLists.active" :key="item._id">
          {{ item.data }}
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>DRAFT</legend>
      <div>
        <div v-for="item in megaMap.subLists.draft" :key="item._id">
          {{ item.data }}
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>INACTIVE</legend>
      <div>
        <div v-for="item in megaMap.subLists.inactive" :key="item._id">
          {{ item.data }}
        </div>
      </div>
    </fieldset>

  </template>
</template>

<script setup>

import {ReactiveMegaMap} from "megamap"

const megaMap = new ReactiveMegaMap({
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
