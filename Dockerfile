# 构建阶段
FROM node:23-slim as builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 设置Node.js内存限制
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 复制server目录的package.json
COPY server/package*.json ./server/

# 安装server目录依赖
WORKDIR /app/server
RUN npm install

# 复制必要的源代码文件
WORKDIR /app
COPY package*.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.js ./
COPY jsconfig.json ./
COPY server/ ./server/
COPY start.sh ./

# 安装根目录依赖
RUN npm install

# 构建前端项目
RUN npm run build

# 生产阶段
FROM node:23-slim

WORKDIR /app

# 安装生产环境依赖
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# 设置Node.js内存和性能优化配置
ENV NODE_OPTIONS="--max-old-space-size=4096 --enable-source-maps"
ENV NODE_ENV=production

# 复制必要文件
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/package*.json ./

# 安装生产环境依赖
WORKDIR /app/server
RUN npm ci 

WORKDIR /app
RUN npm ci 

# 复制其他文件
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/jsconfig.json ./
COPY --from=builder /app/vite.config.js ./
COPY --from=builder /app/public ./public

# 暴露服务端口
EXPOSE 9090 9009

# 复制启动脚本
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]