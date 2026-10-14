// 服务入口：Express + RESTful API
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PORT, CATEGORIES, CONDITIONS } from './config.js';
import './db.js'; // 连接并初始化数据库（首次启动自动建表、写入演示数据）
import { ensureSeedImages } from './seed-images.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import favoriteRoutes from './routes/favorites.js';
import orderRoutes from './routes/orders.js';
import commentRoutes from './routes/comments.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 上传文件静态资源
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
ensureSeedImages();
app.use('/uploads', express.static(uploadsDir));

// RESTful API 路由
app.get('/api/meta', (req, res) => res.json({ categories: CATEGORIES, conditions: CONDITIONS }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 生产环境：若前端已构建（frontend/dist），由后端一并托管，单端口即可访问
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// 统一错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || '服务器内部错误' });
});

// 启动 HTTP 服务；监听 error 事件，端口被占用时给出友好的中文提示
import { exec } from 'node:child_process';

// 查询占用某端口的进程 PID（Windows 用 netstat，Mac/Linux 用 lsof）
function findPidByPort(port) {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    exec(isWin ? 'netstat -ano -p tcp' : `lsof -nP -iTCP:${port} -sTCP:LISTEN`, (err, stdout) => {
      if (err || !stdout) return resolve(null);
      if (isWin) {
        const line = stdout.split(/\r?\n/).find((l) => l.includes(`:${port}`) && /LISTENING/i.test(l));
        resolve(line ? line.trim().split(/\s+/).pop() : null);
      } else {
        const line = stdout.split('\n').find((l) => l.includes(`:${port} (LISTEN)`));
        resolve(line ? line.trim().split(/\s+/)[1] : null);
      }
    });
  });
}

const server = app.listen(PORT, () => {
  console.log(`\n  悦享食堂后端服务已启动:  http://localhost:${PORT}`);
  console.log('  演示账号: admin/admin123 (管理员)  alice/bob 为学生顾客, chuancook/yuecook/qingfood/naicha 为商家, 密码均为 123456\n');
});

server.on('error', async (err) => {
  if (err.code === 'EADDRINUSE') {
    const pid = await findPidByPort(PORT);
    console.error(`\n  ❌ 启动失败：${PORT} 端口已被占用——悦享食堂服务很可能已经在运行了。`);
    console.error(`     可以先直接用浏览器访问 http://localhost:${PORT} 确认。`);
    if (pid) {
      console.error(`     占用进程 PID：${pid}，如需重启请先结束它：`);
      console.error(`       Windows：taskkill /PID ${pid} /F`);
      console.error(`       Mac/Linux：kill ${pid}`);
    }
    console.error('     也可以换端口启动：Windows 执行  set PORT=3001 && npm start\n');
    process.exit(1);
  }
  console.error('服务器启动失败：', err);
  process.exit(1);
});
