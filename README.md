# qilin-Auto 影视库自动化任务管理平台

## 🌟 项目简介
影视库自动化解决方案，实现了网盘文件实时生成strm文件，Cloudsaver保存文件后，自动通知Alist目录刷新，还有Alist-strm自动生成strm文件，不依赖定时任务，减少访问网盘的次数和提高执行效率。

## 🚀 核心功能
- **Alist目录智能刷新**  
  实时监控Cloudsaver保存文件动作，自动触发媒体库更新
- **多任务协同调度**  
  支持Alist-strm/TaoSync(未来)任务并行执行，网盘文件转存后自动生成strm或同步文件
- **日志全景监控**  
  提供实时日志追踪与历史记录查询，错误智能预警

## 🛠 技术架构
### 前端技术栈
- Vue 3 + Element Plus  
  SPA应用框架与UI组件库
- Vite  
  下一代前端构建工具
- Pinia  
  状态管理解决方案

### 后端技术栈
- Node.js + Express  
  高性能服务端框架
- Docker + Docker Compose  
  容器化部署方案
- 文件系统监控  
  基于inotify的目录监听机制

## 📦 安装部署

### 源码部署
```bash
# 克隆仓库
git clone https://github.com/your-repo/qilin-auto.git
cd qilin-auto

# 安装依赖
npm install
cd server && npm install

# 启动后端服务
node server.js

# 启动前端服务
cd ..
npm run dev
```

### Docker部署
```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```


## 🔧 使用指南
1. **监控配置**  
   通过「CloudSaver日志监控」模块创建监控任务
2. **自动化设置**  
   在「自动化列表」中配置Alist-strm/TaoSync任务
3. **日志查看**  
   点击任务日志按钮查看实时运行状态



## 📄 开源协议
本项目采用 [MIT License](LICENSE)
