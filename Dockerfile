# 多阶段构建：先装依赖并打包前端，再用精简镜像运行
FROM node:24-bookworm-slim AS build
WORKDIR /app

# 先拷贝依赖清单，利用 Docker 缓存层
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix backend && npm ci --prefix frontend

# 拷贝全部源码并构建前端
COPY backend ./backend
COPY frontend ./frontend
RUN npm --prefix frontend run build

# ---- 运行阶段 ----
FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app

# 后端代码与依赖 + 前端构建产物（server.js 会单端口托管 frontend/dist）
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

# 云平台通过 PORT 环境变量指定端口，代码已支持 process.env.PORT
EXPOSE 3000
CMD ["node", "backend/src/server.js"]
