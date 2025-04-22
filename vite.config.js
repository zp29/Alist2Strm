import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite' // 自动导入vue中 的组件
import Components from 'unplugin-vue-components/vite'  // 自动导入ui- 组件 比如 element-plus 等
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers' // 对应组件 库引


 
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    //element -plus按需导入
  AutoImport({
    resolvers: [ElementPlusResolver()] ,
  }),
  Components({
    resolvers: [
  // 配置elementPlus采用 sass样式配置系统
      ElementPlusResolver({importStyle:"sass"})
      ],
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/css/index.scss" as *;'
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',  // 允许外部网络访问
    port: 9089,        // 指定端口
    strictPort: true,  // 如果端口被占用则会直接退出
    open: false,        // 启动时自动打开浏览器
    proxy: {
      '/api': {
        target: 'http://localhost:9009',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 9090,        // 指定预览服务器端口
    strictPort: true,  // 如果端口被占用则会直接退出
    host: '0.0.0.0'    // 允许外部网络访问
  }, 
})
