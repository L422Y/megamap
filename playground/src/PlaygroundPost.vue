<template>
  <article>
    <header>
      <h3>{{ item.title }}</h3>
      <div>
        Author: {{ item.author }}
      </div>
    </header>
    <div class="tags">
      <span v-for="tag in item.tags" :key="tag" class="tag">
        <span>{{ tag }}</span>
      </span>
    </div>
    <p>
      {{ item.content }}
    </p>
  </article>
</template>
<script setup>
import {defineProps} from "vue"

defineProps({
  item: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
article {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

h3 {
  margin: 0;
}

.tags {
  display: flex;
  gap: .5rem;
  margin-bottom: 1rem;
}

.tag {
  font-size: .9rem;
  background-color: #ccc;
  padding: .25rem .5rem;
  border-radius: .25rem;
}
</style>
