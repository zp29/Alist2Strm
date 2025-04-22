import { ref, watch } from 'vue'
import { useCssVar } from '@vueuse/core'

// 创建主题状态
const isDark = ref(false)

// 定义主题变量
const bgColor = useCssVar('--bg-color')
const textColor = useCssVar('--text-color')
const cardBgColor = useCssVar('--card-bg-color')
const sidebarBorderColor = useCssVar('--sidebar-border-color')
const tableBgColor = useCssVar('--table-bg-color')
const tableTextColor = useCssVar('--table-text-color')
const tableHeaderBgColor = useCssVar('--table-header-bg-color')

// 监听主题变化并更新CSS变量
watch(isDark, (newValue) => {
  if (newValue) {
    // 暗黑模式
    bgColor.value = '#1a1a1a'
    textColor.value = '#ffffff'
    cardBgColor.value = '#2c2c2c'
    sidebarBorderColor.value = '#363636'
    tableBgColor.value = '#2c2c2c'
    tableTextColor.value = '#ffffff'
    tableHeaderBgColor.value = '#363636'
  } else {
    // 明亮模式
    bgColor.value = '#ffffff'
    textColor.value = '#333333'
    cardBgColor.value = '#ffffff'
    sidebarBorderColor.value = '#e6e6e6'
    tableBgColor.value = '#ffffff'
    tableTextColor.value = '#333333'
    tableHeaderBgColor.value = '#f5f7fa'
  }
})

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value
}

export function useTheme() {
  return {
    isDark,
    toggleTheme
  }
}