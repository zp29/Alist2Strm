<template>
  <div class="automation-container">
    <div class="title-container">
      <h1 class="section-title">创建自动化</h1>
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
    
    <h2 class="subsection-title">qilin Auto令牌配置</h2>
    <el-card class="content-card">
      <div class="card-actions">
        <el-button type="primary" @click="handleCreateClick">创建</el-button>
        <el-button type="danger" :disabled="monitorConfigs.length === 0" @click="deleteMonitorConfig(0)">删除</el-button>
      </div>
      <el-table v-if="monitorConfigs.length > 0" :data="monitorConfigs" style="width: 100%">
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="api_key" label="API令牌" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <div style="display: flex; gap: 8px; justify-content: flex-start;">
              <el-button
                size="small"
                :type="scope.row.status === 'active' ? 'warning' : 'success'"
                @click="toggleMonitorStatus(scope.$index)"
              >
                {{ scope.row.status === 'active' ? '停止' : '启动' }}
              </el-button>
              <el-button
                size="small"
                type="primary"
                @click="handleEditMonitor(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="info"
                @click="handleViewLog(scope.row)"
              >
                日志
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="card-message">
        <span class="message-text">暂无API令牌，请点击创建按钮添加</span>
      </div>
    </el-card>

    <!-- 创建监控配置的对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建API令牌配置"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="API令牌">
          <el-input v-model="form.api_key" placeholder="请输入API令牌" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createMonitorConfig">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑监控配置的对话框 -->
    <el-dialog
      v-model="monitorEditDialogVisible"
      title="编辑API令牌配置"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="monitorEditForm" label-width="120px">
        <el-form-item label="API令牌">
          <el-input v-model="monitorEditForm.api_key" placeholder="请输入API令牌" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="monitorEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateMonitorConfig">确定</el-button>
        </span>
      </template>
    </el-dialog>

    
    <h2 class="subsection-title">自动化列表</h2>
    <el-card class="content-card">
      <div class="card-actions">
        <el-button type="success" @click="handleCreateAutomation">新增</el-button>
        <el-button type="danger" :disabled="automationTasks.length === 0" @click="deleteAutomationTask">删除</el-button>
      </div>
      <el-table v-if="automationTasks.length > 0" :data="automationTasks" style="width: 100%">
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="program" label="自动化程序">
          <template #default="scope">
            {{ scope.row.program === 'alist' ? 'Alist目录刷新' : scope.row.program }}
          </template>
        </el-table-column>
        <el-table-column label="模式" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.pathMatch ? 'success' : 'warning'">
              {{ scope.row.pathMatch ? '匹配模式' : '常规模式' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配置ID或目录">
          <template #default="scope">
            {{ scope.row.program === 'alist' ? scope.row.monitorPath : scope.row.configId }}
          </template>
        </el-table-column>
        <el-table-column prop="delayTime" label="延迟时间(秒)" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <div style="display: flex; gap: 8px; justify-content: flex-start;">
              <el-button
                size="small"
                :type="scope.row.status === 'active' ? 'warning' : 'success'"
                @click="toggleAutomationStatus(scope.$index)"
              >
                {{ scope.row.status === 'active' ? '停止' : '启动' }}
              </el-button>
              <el-button
                size="small"
                type="primary"
                @click="handleEditAutomation(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteAutomationTask(scope.row.id)"
              >
                删除
              </el-button>
              <el-button
                size="small"
                type="info"
                @click="handleViewAutomationLog(scope.row)"
              >
                日志
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="card-message">
        <span class="message-text">暂无自动化任务，请点击新增按钮添加</span>
      </div>
    </el-card>

    <!-- 创建自动化任务的对话框 -->
    <el-dialog
      v-model="automationDialogVisible"
      title="创建自动化任务"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="automationForm" label-width="120px">
        <el-form-item label="自动化程序">
          <el-select v-model="automationForm.program" placeholder="请选择自动化程序">
            <el-option
              v-for="option in programOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="路径匹配">
          <el-switch v-model="automationForm.pathMatch" />
        </el-form-item>
        <el-form-item :label="(automationForm.program === 'alist' || automationForm.program === 'alist-strm' || (automationForm.program === 'taosync' && automationForm.pathMatch)) ? (automationForm.pathMatch ? '匹配规则' : (automationForm.program === 'alist' ? '监控路径' : '配置ID'))  : '配置ID'">
          <el-input 
            v-if="automationForm.program === 'alist'"
            v-model="automationForm.monitorPath" 
            :placeholder="automationForm.pathMatch ? '请输入匹配规则' : '请输入alist的根目录'" />
          <el-input 
            v-else
            v-model="automationForm.configId" 
            :disabled="automationForm.program !== 'alist-strm' && automationForm.program !== 'taosync' && !automationForm.pathMatch"
            :placeholder="(automationForm.program === 'alist-strm' || automationForm.program === 'taosync') && automationForm.pathMatch ? '请输入匹配规则' : (automationForm.program === 'taosync' ? '请输入配置ID,如1或者1;2' : '请输入配置ID,如1或者1,2')" />
        </el-form-item>
        <el-form-item label="延迟时间(秒)">
          <el-input-number v-model="automationForm.delayTime" :min="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="automationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createAutomationTask">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑自动化任务的对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑自动化任务"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="自动化程序">
          <el-input :value="editForm.program" disabled />
        </el-form-item>
        <el-form-item label="路径匹配">
          <el-switch v-model="editForm.pathMatch" />
        </el-form-item>
        <el-form-item :label="(editForm.program === 'alist' || editForm.program === 'alist-strm' || (editForm.program === 'taosync' && editForm.pathMatch)) ? (editForm.pathMatch ? '匹配规则' : (editForm.program === 'alist' ? '监控路径' : '配置ID'))  : '配置ID'">
          <el-input 
            v-if="editForm.program === 'alist'"
            v-model="editForm.monitorPath" 
            :disabled="!editForm.pathMatch"
            :placeholder="editForm.pathMatch ? '请输入匹配规则' : '请输入alist的根目录'" />
          <el-input 
            v-else
            v-model="editForm.configId" 
            :disabled="editForm.program !== 'alist-strm' && editForm.program !== 'taosync' && !editForm.pathMatch"
            :placeholder="(editForm.program === 'alist-strm' || editForm.program === 'taosync') && editForm.pathMatch ? '请输入匹配规则' : (editForm.program === 'taosync' ? '请输入配置ID,如1或者1;2' : '请输入配置ID,如1或者1,2')" />
        </el-form-item>
        <el-form-item label="延迟时间(秒)">
          <el-input-number v-model="editForm.delayTime" :min="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateAutomationTask">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 日志查看对话框 -->
    <el-dialog
      v-model="logDialogVisible"
      title="日志内容"
      width="60%"
      :close-on-click-modal="false"
      @closed="handleLogDialogClose"
    >
      <div class="log-content" ref="logContentRef">
        <pre>{{ currentLogContent }}</pre>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="() => {
            logDialogVisible = false
            if (logUpdateTimer.value) {
              clearInterval(logUpdateTimer.value)
              logUpdateTimer.value = null
            }
          }">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { Moon, Sunny, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useTheme } from '../composables/useTheme'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const { isDark: isDarkMode, toggleTheme: toggleDarkMode } = useTheme()
const dialogVisible = ref(false)
const monitorConfigs = ref([])
const form = ref({
  api_key: ''
})

const monitorEditDialogVisible = ref(false)
const monitorEditForm = ref({
  id: '',
  api_key: ''
})

const logDialogVisible = ref(false)
const currentLogContent = ref('')
const currentLogConfig = ref(null)
const logContentRef = ref(null)
const logUpdateTimer = ref(null)

// 在组件卸载时清理定时器
onUnmounted(() => {
  if (logUpdateTimer.value) {
    clearInterval(logUpdateTimer.value)
    logUpdateTimer.value = null
  }
})

// 获取最新的日志内容
const fetchLatestLogContent = async () => {
  if (!currentLogConfig.value) return
  
  try {
    const response = await axios.get(`/api/log-monitor/log?path=${encodeURIComponent(currentLogConfig.value.logPath)}`)
    if (response.data !== currentLogContent.value) {
      currentLogContent.value = response.data
      // 使用Vue的nextTick确保DOM更新后再滚动
      await nextTick()
      if (logContentRef.value) {
        logContentRef.value.scrollTop = logContentRef.value.scrollHeight
      }
    }
  } catch (error) {
    console.error('获取日志内容失败:', error)
  }
}

// 查看日志内容
const handleViewLog = async (config) => {
  currentLogConfig.value = config
  try {
    const response = await axios.get(`/api/log-monitor/log?path=${encodeURIComponent(config.logPath)}`)
    currentLogContent.value = response.data
    logDialogVisible.value = true
    // 启动定时器，每2秒更新一次日志内容
    logUpdateTimer.value = setInterval(fetchLatestLogContent, 2000)
    // 使用Vue的nextTick确保DOM更新后再滚动
    await nextTick()
    if (logContentRef.value) {
      logContentRef.value.scrollTop = logContentRef.value.scrollHeight
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取日志内容失败')
    console.error('获取日志内容失败:', error)
  }
}


// 查看自动化任务日志
const handleViewAutomationLog = async (task) => {
  try {
    let logPath = '';
    if (task.program === 'alist') {
      logPath = `/app/server/logs/alist-refresh-${task.portId}.log`;
    } else if (task.program === 'alist-strm') {
      logPath = `/app//server/logs/alist-strm-api-${task.portId}.log`;
    } else if (task.program === 'taosync') {
      logPath = `/app//server/logs/taosync-${task.portId}.log`;
    }
    
    if (!logPath) {
      ElMessage.warning('该任务类型暂不支持查看日志');
      return;
    }

    currentLogConfig.value = { logPath }
    const response = await axios.get(`/api/log-monitor/log?path=${encodeURIComponent(logPath)}`)
    currentLogContent.value = response.data
    logDialogVisible.value = true
    // 启动定时器，每2秒更新一次日志内容
    logUpdateTimer.value = setInterval(fetchLatestLogContent, 2000)
    // 使用Vue的nextTick确保DOM更新后再滚动
    await nextTick()
    if (logContentRef.value) {
      logContentRef.value.scrollTop = logContentRef.value.scrollHeight
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取日志内容失败')
    console.error('获取日志内容失败:', error)
  }
}

// 获取所有监控配置
const fetchMonitorConfigs = async () => {
  try {
    const response = await axios.get('/api/log-monitor')
    monitorConfigs.value = response.data
  } catch (error) {
    ElMessage.error('获取监控配置失败')
    console.error('获取监控配置失败:', error)
  }
}

// 创建监控配置
const createMonitorConfig = async () => {
  if (!form.value.api_key) {
    ElMessage.warning('请输入日志监控目录路径')
    return
  }

  if (monitorConfigs.value.length > 0) {
    ElMessage.warning('已存在监控配置，不能创建更多')
    return
  }

  try {
    const response = await axios.post('/api/log-monitor', {
      api_key: form.value.api_key
    })
    monitorConfigs.value.push(response.data)
    dialogVisible.value = false
    form.value.api_key = ''
    ElMessage.success('创建成功')
  } catch (error) {
    ElMessage.error('创建监控配置失败')
    console.error('创建监控配置失败:', error)
  }
}

// 切换监控状态
const toggleMonitorStatus = async (index) => {
  const config = monitorConfigs.value[index]
  const newStatus = config.status === 'active' ? 'inactive' : 'active'
  
  try {
    await axios.put(`/api/log-monitor/${config.id}/status`, {
      status: newStatus
    })
    config.status = newStatus
  } catch (error) {
    ElMessage.error('更新状态失败')
    console.error('更新状态失败:', error)
  }
}

// 删除监控配置
const deleteMonitorConfig = async (index) => {
  const config = monitorConfigs.value[index]
  try {
    await axios.delete(`/api/log-monitor/${config.id}`)
    monitorConfigs.value.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
    console.error('删除失败:', error)
  }
}

const fetchAutomationTasks = async () => {
  try {
    const response = await axios.get('/api/automation')
    automationTasks.value = response.data
  } catch (error) {
    ElMessage.error('获取自动化任务列表失败')
    console.error('获取自动化任务列表失败:', error)
  }
}

// 页面加载时获取配置
onMounted(() => {
  fetchMonitorConfigs()
  fetchAutomationTasks()
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
  if (monitorConfigs.value.length > 0) {
    ElMessage.warning('已存在监控配置，不能创建更多')
    return
  }
  dialogVisible.value = true
}

// 处理编辑按钮点击
const handleEditMonitor = (config) => {
  monitorEditForm.value = {
    id: config.id,
    api_key: config.api_key
  }
  monitorEditDialogVisible.value = true
}

// 更新监控配置
const updateMonitorConfig = async () => {
  if (!monitorEditForm.value.api_key) {
    ElMessage.warning('请输入日志监控目录路径')
    return
  }

  try {
    const response = await axios.put(`/api/log-monitor/${monitorEditForm.value.id}`, {
      api_key: monitorEditForm.value.api_key
    })
    const index = monitorConfigs.value.findIndex(config => config.id === monitorEditForm.value.id)
    if (index !== -1) {
      monitorConfigs.value[index] = response.data
    }
    monitorEditDialogVisible.value = false
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error('更新监控配置失败')
    console.error('更新监控配置失败:', error)
  }
}

const automationTasks = ref([])
const automationDialogVisible = ref(false)
const automationForm = ref({
  program: '',
  configId: '', // 用于alist-strm和taosync
  monitorPath: '', // 用于alist
  delayTime: 0,
  pathMatch: false // 路径匹配开关
})

const programOptions = [
  { label: 'Alist-strm', value: 'alist-strm' },
  { label: 'TaoSync', value: 'taosync' },
  { label: 'Alist目录刷新', value: 'alist' }
]

const handleCreateAutomation = () => {
  if (monitorConfigs.value.length === 0) {
    ElMessage.warning('请先创建日志监控配置')
    return
  }
  automationDialogVisible.value = true
}

const createAutomationTask = async () => {
  if (!automationForm.value.program) {
    ElMessage.warning('请选择自动化程序')
    return
  }
  if (!automationForm.value.pathMatch) {
    if (automationForm.value.program === 'alist' && !automationForm.value.monitorPath) {
      ElMessage.warning('请输入监控路径')
      return
    } else if (automationForm.value.program !== 'alist' && !automationForm.value.configId) {
      ElMessage.warning('请输入配置ID')
      return
    }
  }

  try {
    let taskData = {
      ...automationForm.value,
      createTime: new Date().toISOString(),
      status: 'inactive'
    }
    
    // 为所有项目添加 portId
    const existingTasks = automationTasks.value.filter(task => task.program === automationForm.value.program)
    const maxPortId = existingTasks.length > 0
      ? Math.max(...existingTasks.map(task => task.portId || 0))
      : 0
    taskData.portId = maxPortId + 1
    
    const response = await axios.post('/api/automation', taskData)
    automationTasks.value.push(response.data)
    automationDialogVisible.value = false
    automationForm.value = {
      program: '',
      configId: '',
      monitorPath: '',
      delayTime: 0,
      pathMatch: false
    }
    ElMessage.success('创建成功')
  } catch (error) {
    ElMessage.error('创建自动化任务失败')
    console.error('创建自动化任务失败:', error)
  }
}

const deleteAutomationTask = async (taskId) => {
  try {
    await axios.delete(`/api/automation/${taskId}`);
    automationTasks.value = automationTasks.value.filter(task => task.id !== taskId);
    ElMessage.success('删除成功');
  } catch (error) {
    ElMessage.error('删除失败');
    console.error('删除失败:', error);
  }
};

const toggleAutomationStatus = async (index) => {
  const task = automationTasks.value[index]
  const newStatus = task.status === 'active' ? 'inactive' : 'active'
  
  try {
    await axios.put(`/api/automation/${task.id}/status`, {
      status: newStatus
    })
    task.status = newStatus
    ElMessage.success(`${newStatus === 'active' ? '启动' : '停止'}成功`)
  } catch (error) {
    ElMessage.error('更新状态失败')
    console.error('更新状态失败:', error)
  }
}

const editDialogVisible = ref(false)
const editForm = ref({
  id: null,
  program: '',
  configId: '',
  monitorPath: '',
  delayTime: 0,
  portId: null,
  pathMatch: false
})

const handleEditAutomation = (task) => {
  editForm.value = { ...task }
  editDialogVisible.value = true
}

const updateAutomationTask = async () => {
  if (!editForm.value.pathMatch) {
    if (editForm.value.program === 'alist') {
      if (!editForm.value.monitorPath) {
        ElMessage.warning('请输入监控路径')
        return
      }
    } else {
      if (!editForm.value.configId) {
        ElMessage.warning('请输入配置ID')
        return
      }

      // 检查是否存在相同类型的任务（除了当前正在编辑的任务）
      const existingTask = automationTasks.value.find(
        task => task.program === editForm.value.program && task.id !== editForm.value.id
      )
      if (existingTask) {
        ElMessage.warning(`已存在${editForm.value.program}自动化任务`)
        return
      }
    }
  }

  // 检查是否存在同类型且启用了路径匹配的任务（除了当前正在编辑的任务）
  if (editForm.value.pathMatch) {
    const existingPathMatchTask = automationTasks.value.find(
      task => task.program === editForm.value.program && task.pathMatch && task.id !== editForm.value.id
    )
    if (existingPathMatchTask) {
      ElMessage.warning(`已存在${editForm.value.program}的路径匹配任务，不能创建更多`)
      return
    }
  }

  try {
    await axios.put(`/api/automation/${editForm.value.id}`, editForm.value)
    const index = automationTasks.value.findIndex(task => task.id === editForm.value.id)
    if (index !== -1) {
      automationTasks.value[index] = { ...editForm.value }
    }
    editDialogVisible.value = false
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error('更新自动化任务失败')
    console.error('更新自动化任务失败:', error)
  }
}
// 处理日志对话框关闭
const handleLogDialogClose = () => {
  if (logUpdateTimer.value) {
    clearInterval(logUpdateTimer.value)
    logUpdateTimer.value = null
  }
  currentLogContent.value = ''
  currentLogConfig.value = null
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
  border-bottom-color: #e0e0e0;
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

.log-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  background-color: var(--code-bg-color);
  border-radius: 4px;
}



.log-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--text-color);
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}
</style>