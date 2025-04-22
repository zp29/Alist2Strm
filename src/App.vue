<template>
  <div class="app-container" :class="{ 'dark-mode': isDark }">
    <Sidebar v-if="$route.path !== '/login'" class="sidebar" />
    <div class="main-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import { useTheme } from './composables/useTheme'

const { isDark } = useTheme()
</script>

<style>
:root {
  --bg-color: #ffffff;
  --text-color: #333333;
  --card-bg-color: #ffffff;
}
</style>

<style scoped>


.app-container {
  height: 100%;
  display: flex;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.app-container:not(:has(> .sidebar)) {
  background-image: linear-gradient(-225deg, #69EACB 0%, #EACCF8 48%, #6654F1 100%);
}

.sidebar {
  width: 220px;
  height: 100%;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>