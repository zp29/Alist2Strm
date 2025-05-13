<template>
  <div class="about-container">
    <div class="title-container">
      <h1 class="section-title">关于qilin Auto</h1>
      <div class="title-buttons">
        <el-button type="info" circle @click="toggleDarkMode">
          <el-icon><component :is="isDarkMode ? 'Sunny' : 'Moon'" /></el-icon>
        </el-button>
        <el-button type="danger" circle @click="exitApplication">
          <el-icon><SwitchButton /></el-icon>
        </el-button>
      </div>
    </div>
    <el-divider></el-divider>
    <div class="content">
      <img src="../assets/img/qilinauto-logo.png" alt="QilinAuto Logo" class="logo" />
      <p class="description">一款能创建影视库自动化任务的应用</p>
      <p class="version">版本：v1.0.3</p>
      <p class="links">
        <a href="https://github.com/linzxcw/qilin-Auto" target="_blank" rel="noopener noreferrer">
          Github主页：https://github.com/linzxcw/qilin-Auto
        </a>
      </p>
      <p class="links">
        <a href="https://space.bilibili.com/351478349?spm_id_from=333.1007.0.0" target="_blank" rel="noopener noreferrer">
          B站教程：https://space.bilibili.com/351478349?spm_id_from=333.1007.0.0
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { Moon, Sunny, SwitchButton } from '@element-plus/icons-vue'
import { useTheme } from '../composables/useTheme'
import { useRouter } from 'vue-router'

const router = useRouter()
const { isDark: isDarkMode, toggleTheme: toggleDarkMode } = useTheme()

const exitApplication = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('expiresAt')
  router.push('/login')
}
</script>

<style scoped>
.about-container {
  padding: 0 20px;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.logo {
  width: 120px;
  height: auto;
}

.description {
  font-size: 18px;
  margin: 0;
}

.version {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.links {
  margin: 0;
}

.links a {
  color: var(--el-color-primary);
  text-decoration: none;
  transition: color 0.3s;
}

.links a:hover {
  color: var(--el-color-primary-light-3);
}

.title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.title-buttons {
  display: flex;
  gap: 10px;
}
</style>