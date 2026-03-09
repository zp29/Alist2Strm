# Alist2Strm

自动化媒体库管理平台，监控 Cloudsaver 日志触发 Alist 刷新和 strm 文件生成。

## 功能

- **Alist 自动刷新** - 监控 Cloudsaver 日志，文件保存后自动刷新 Alist 目录
- **Strm 文件生成** - 调用 Alist-strm API 自动生成 strm 文件
- **任务调度** - 支持 Alist-strm、TaoSync 等任务的自动化执行
- **日志监控** - 实时日志追踪和历史查询

## 技术栈

- 前端：Vue 3 + Element Plus + Vite
- 后端：Node.js + Express + WebSocket
- 部署：Docker

## 快速开始

### Docker 部署（推荐）

```yaml
version: '3'
services:
  alist2strm:
    image: zp29/Alist2strm:latest
    container_name: Alist2strm
    ports:
      - "9090:9090"
      - "9009:9009"
    volumes:
      - /path/to/cloudsaver/logs:/app/logs  # Cloudsaver 日志目录
      - ./data:/app/server/data
    restart: always
    environment:
      - NODE_ENV=production
```

启动：
```bash
docker-compose up -d
```

### 源码部署

```bash
# 克隆仓库
git clone https://github.com/zp29/Alist2strm.git
cd Alist2strm

# 安装依赖
npm install
cd server && npm install && cd ..

# 启动服务
cd server && node server.js &
cd .. && npm run dev
```

## 配套服务

**Alist-strm（带 API 接口）**
```yaml
services:
  alist-strm:
    image: zp29/alist-strm:latest
    container_name: alist-strm-api
    ports:
      - "5000:5000"
    volumes:
      - ./video:/volume1/video  # 网盘挂载路径
      - ./config:/config
    restart: always
```

**TaoSync（网盘同步）**
```yaml
services:
  taosync:
    image: zp29/tao-sync:latest
    container_name: taoSync
    ports:
      - "8023:8023"
    volumes:
      - ./data:/app/data
    restart: always
```

## 文档

详细教程：https://www.yuque.com/qilinzhu-qvn1j/oxp3nl/eb8dz4116tmruf9o  
访问密码：gity

## 交流群

QQ 群：784295077（已满）、698788293

## 开源协议

MIT License
