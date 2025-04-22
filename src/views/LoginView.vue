<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="logo-container">
          <img src="../assets/img/qilinauto-logo.png" alt="QilinAuto Logo" class="logo-image" />
          <h2 class="login-title">qilin Auto</h2>
        </div>
      </template>
      <el-form :model="loginForm" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="loginForm.rememberMe">记住登录</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" class="login-button" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false
})

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginForm.value.username,
          password: loginForm.value.password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const expiresIn = loginForm.value.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const expiresAt = new Date().getTime() + expiresIn;
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('expiresAt', expiresAt.toString());
        
        ElMessage.success('登录成功');
        router.push('/');
      } else {
        throw new Error(data.error || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      ElMessage.error(error.message || '登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: linear-gradient(-225deg, #69EACB 0%, #EACCF8 48%, #6654F1 100%);
  background-size: cover;
  background-position: center;
}

.login-card {
  width: 100%;
  max-width: 320px;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-card :deep(.el-card__header) {
  border-bottom: none;
  padding-bottom: 0;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.logo-image {
  width: 100px;
  height: auto;
}

.login-title {
  text-align: center;
  margin: 0;
  color: var(--el-text-color-primary);
}

.login-button {
  width: 100%;
}
</style>