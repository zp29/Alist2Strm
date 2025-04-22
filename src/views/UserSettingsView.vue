<template>
  <div class="automation-container">
    <div class="title-container">
      <h1 class="section-title">用户设置</h1>
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
    
    <h2 class="subsection-title">用户名和密码</h2>
    <el-card class="content-card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="新用户名" prop="newUsername">
          <el-input v-model="form.newUsername" placeholder="请输入新用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码"></el-input>
        </el-form-item>
        <el-form-item>
          <div class="button-group">
            <el-button type="primary" @click="handleSubmit">确认</el-button>
            <el-button @click="handleCancel">取消</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Moon, Sunny, SwitchButton } from '@element-plus/icons-vue'
import { useTheme } from '../composables/useTheme'

const router = useRouter()
const formRef = ref(null)
const { isDark: isDarkMode, toggleTheme: toggleDarkMode } = useTheme()

const form = reactive({
  newUsername: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  newUsername: [
    { required: true, message: '请输入新用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3到20个字符之间', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    const username = localStorage.getItem('username') || 'admin'
    const response = await fetch('/api/auth/update-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        newUsername: form.newUsername,
        newPassword: form.newPassword
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error)
    }

    // 更新本地存储的用户名
    localStorage.setItem('username', data.username)
    ElMessage.success('设置已更新')
    router.push('/')
  } catch (error) {
    console.error('更新设置失败:', error)
    ElMessage.error(error.message || '更新设置失败')
  }
}

const exitApplication = () => {
  // 清除登录信息
  localStorage.removeItem('token')
  localStorage.removeItem('expiresAt')
  // 跳转到登录页面
  router.push('/login')
}
</script>

<style scoped>
.automation-container {
  padding: 0 20px;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.title-buttons {
  display: flex;
  gap: 12px;
}

.subsection-title {
  margin: 20px 0;
  font-size: 20px;
  font-weight: 500;
}

.content-card {
  background-color: var(--card-bg-color);
  border-radius: 8px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style>