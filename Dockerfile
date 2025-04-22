# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

# 复制server目录的package.json
COPY server/package*.json ./server/

# 安装server目录依赖
WORKDIR /app/server
RUN npm ci

# 复制根目录的package.json和源代码
WORKDIR /app
COPY package*.json ./
COPY . .

# 安装根目录依赖
RUN npm ci

# 构建前端项目
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 复制必要文件
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/package*.json ./

# 安装生产环境依赖
WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app
RUN npm ci --only=production

# 复制其他文件
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/jsconfig.json ./
COPY --from=builder /app/vite.config.js ./
COPY --from=builder /app/public ./public

# 设置环境变量
ENV NODE_ENV=production

# 暴露服务端口
EXPOSE 9090 9009

# 复制启动脚本
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]