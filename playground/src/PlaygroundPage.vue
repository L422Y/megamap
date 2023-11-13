<template>
  <div v-if="megaMap.subLists" class="relative flex min-h-screen flex-col p-4">
    <h1>MegaMap Playground</h1>

    <button class="button" @click="getRandomArticle">
      <span>Get Random Article</span>
    </button>
    <fieldset>
      <legend>Articles</legend>
      <div>
        <h2>Published</h2>
        <section>
          <PlaygroundPost v-for="item in megaMap.subLists.published" :key="item._id" :item="item"/>
        </section>
      </div>
      <div>
        <h2>Drafts</h2>
        <section>
          <PlaygroundPost v-for="item in megaMap.subLists.draft" :key="item._id" :item="item"/>

        </section>
      </div>
    </fieldset>

    <fieldset>
      <legend>Named Queries</legend>
      <div>
        <h2>By Author</h2>
        <section>
          <PlaygroundPost v-for="item in authorPosts" :key="item._id" :item="item"/>
        </section>
      </div>
      <div>
        <h2>By Tag</h2>
        <select v-model="selectedTag">
          <option v-for="tag in ['fake','mock','dummy']" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
        <section>
          <PlaygroundPost v-for="item in taggedPosts" :key="item._id" :item="item"/>
        </section>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
import {ReactiveMegaMap} from "megamap"
import {ref} from "vue"
import {watch} from "vue"
import PlaygroundPost from "./PlaygroundPost.vue"

const selectedTag = ref("fake")

const megaMap = new ReactiveMegaMap({
  loadOne: async (key) => await fetch(`/api/posts/by-id/${key}`).then(res => res.json()),
  loadAll: async () => await fetch("/api/posts").then(res => res.json()),
  subListFilters: {
    published: (item) => item.status === "published",
    draft: (item) => item.status === "draft",
  },
  namedQueries: {
    byAuthor: async (authorId) => {
      return fetch(`/api/posts/by-author/${authorId}`).then(res => res.json())
    },
    byTag: async (tag) => {
      return fetch(`/api/posts/by-tag/${tag}`).then(res => res.json())
    },
  }
})

const authorPosts = ref(await megaMap.query.byAuthor("00001"))
const taggedPosts = ref(await megaMap.query.byTag(selectedTag.value))


watch(selectedTag, async (newValue) => taggedPosts.value = await megaMap.query.byTag(newValue))

const getRandomArticle = async () => {
  await megaMap.get(`key${Math.floor(Math.random() * 1008) + 1}`)
}

</script>

<style>

body {
  font-family: sans-serif;
  padding: 1rem;
}

section {
  display: grid;
  grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));
  flex-wrap: wrap;
  gap: 1rem;

}

article {
  border: 1px solid #ccc;
  overflow: scroll;
  min-height: 5rem;
  height: 5rem;
  padding: 0 1rem;
  resize: vertical;
}


button {
  margin: 1rem 0;
  padding: 0.5rem 0.9rem;
  border: 1px solid #ccc;
  border-radius: 2rem;
  cursor: pointer;
  transition: background .2s;
}

button:hover {
  background: #ccc;
}

fieldset {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 1rem;
}

legend {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

fieldset + fieldset {
  margin-top: 2rem;
}
</style>
