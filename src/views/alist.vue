<template>
  <div class="automation-container">
    <div class="title-container">
      <h1 class="section-title">Alist设置</h1>
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
    
    <h2 class="subsection-title">设置参数</h2>
    <el-card class="content-card">
      <div class="card-actions">
        <el-button type="primary" @click="handleCreateClick">创建</el-button>
        <el-button type="danger" :disabled="Object.keys(configs).length === 0" @click="handleDelete">删除</el-button>
      </div>
      <el-table v-if="Object.keys(configs).length > 0" :data="configList" style="width: 100%">
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="address" label="Alist地址" />
        <el-table-column prop="apiKey" label="API Key" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              size="small"
              type="success"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="card-message">
        <span class="message-text">暂无配置，请点击创建按钮添加</span>
      </div>
    </el-card>

    <!-- 创建配置的对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建Alist配置"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="Alist地址：">
          <el-input v-model="form.address" placeholder="请输入Alist地址" />
        </el-form-item>
        <el-form-item label="API Key：">
          <el-input v-model="form.apiKey" placeholder="请输入API Key" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreate">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑配置的对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑Alist配置"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="Alist地址：">
          <el-input v-model="editForm.address" placeholder="请输入Alist地址" />
        </el-form-item>
        <el-form-item label="API Key：">
          <el-input v-model="editForm.apiKey" placeholder="请输入API Key" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdate">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Moon, Sunny, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useTheme } from '../composables/useTheme'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const { isDark: isDarkMode, toggleTheme: toggleDarkMode } = useTheme()
const dialogVisible = ref(false)
const editDialogVisible = ref(false)
const configs = ref({})
const form = ref({
  address: '',
  apiKey: ''
})

const editForm = ref({
  id: '',
  address: '',
  apiKey: ''
})

// 将配置对象转换为数组以供表格使用
const configList = computed(() => {
  return Object.values(configs.value)
})

// 获取所有配置
const fetchConfigs = async () => {
  try {
    const response = await axios.get('/api/alist')
    configs.value = response.data
  } catch (error) {
    ElMessage.error('获取配置失败')
    console.error('获取配置失败:', error)
  }
}

// 创建配置
const handleCreate = async () => {
  if (!form.value.address || !form.value.apiKey) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    const response = await axios.post('/api/alist', form.value)
    configs.value[response.data.id] = response.data
    dialogVisible.value = false
    form.value.address = ''
    form.value.apiKey = ''
    ElMessage.success('创建成功')
  } catch (error) {
    ElMessage.error('创建配置失败')
    console.error('创建配置失败:', error)
  }
}

// 删除配置
const handleDelete = async () => {
  const id = Object.keys(configs.value)[0]
  try {
    await axios.delete(`/api/alist/${id}`)
    delete configs.value[id]
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
    console.error('删除失败:', error)
  }
}

// 页面加载时获取配置
onMounted(() => {
  fetchConfigs()
})

const exitApplication = () => {
  // 清除登录信息
  localStorage.removeItem('token')
  localStorage.removeItem('expiresAt')
  // 跳转到登录页面
  router.push('/login')
}

// 处理创建按钮点击
const handleCreateClick = () => {
  if (Object.keys(configs.value).length > 0) {
    ElMessage.warning('已存在配置，不能创建更多')
    return
  }
  dialogVisible.value = true
}

// 处理编辑按钮点击
const handleEdit = (config) => {
  editForm.value = { ...config }
  editDialogVisible.value = true
}

// 更新配置
const handleUpdate = async () => {
  if (!editForm.value.address || !editForm.value.apiKey) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    const response = await axios.put(`/api/alist/${editForm.value.id}`, {
      address: editForm.value.address,
      apiKey: editForm.value.apiKey
    })
    configs.value[editForm.value.id] = response.data
    editDialogVisible.value = false
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error('更新配置失败')
    console.error('更新配置失败:', error)
  }
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
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  padding: 0px 0;
}

.title-buttons {
  display: flex;
  gap: 10px;
}

.subsection-title {
  font-size: 18px;
  font-weight: bold;
  margin: 20px 0 10px 0;
}

.content-card {
  margin-bottom: 20px;
  background-color: var(--card-bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

:deep(.el-table) {
  background-color: var(--table-bg-color);
  color: var(--table-text-color);
  --el-table-header-bg-color: var(--table-header-bg-color);
  --el-table-tr-bg-color: var(--table-bg-color);
}

:deep(.el-table th),
:deep(.el-table td) {
  background-color: var(--table-bg-color);
  border-bottom-color: var(--sidebar-border-color);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: var(--table-header-bg-color);
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.card-message {
  text-align: center;
}

.message-text {
  color: #909399;
  font-size: 14px;
  font-style: italic;
}
</style>