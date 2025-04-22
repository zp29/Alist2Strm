<template>
  <div class="sidebar">
    <h2 class="sidebar-title">qilin Auto</h2>
    <el-menu
      default-active="1"
      class="sidebar-menu"
      router
    >
      <el-menu-item index="/automation">
        <el-icon><Setting /></el-icon>
        <span>自动化</span>
      </el-menu-item>
      <el-menu-item index="/alist-strm">
        <el-icon><Monitor /></el-icon>
        <span>Alist-strm设置</span>
      </el-menu-item>
      <el-menu-item index="/alist">
        <el-icon><Document /></el-icon>
        <span>Alist设置</span>
      </el-menu-item>

      <el-menu-item index="/taosync">
        <el-icon><Connection /></el-icon>
        <span>TaoSync设置</span>
      </el-menu-item>
      <el-menu-item index="/user">
        <el-icon><User /></el-icon>
        <span>用户设置</span>
      </el-menu-item>
      <el-menu-item index="/about">
        <el-icon><InfoFilled /></el-icon>
        <span>关于</span>
      </el-menu-item>
      <el-menu-item disabled>
        <el-icon><More /></el-icon>
        <span>更多服务接入中</span>
        <el-icon><More /></el-icon>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { Setting, Document, Connection, User, InfoFilled, More, Monitor } from '@element-plus/icons-vue'
</script>

<style scoped>
.sidebar {
  height: 100%;
  border-right: 1px solid var(--sidebar-border-color);
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.sidebar-title {
  padding: 20px;
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid var(--sidebar-border-color);
  color: var(--text-color);
}

.sidebar-menu {
  border-right: none;
  background-color: var(--bg-color);
}

:deep(.el-menu-item) {
  color: var(--text-color);
}

:deep(.el-menu-item.is-active) {
  color: var(--el-menu-active-color);
}
</style>