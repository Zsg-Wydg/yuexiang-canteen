// JWT 鉴权中间件
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { db } from '../db.js';

// 必须登录
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: '请先登录' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ message: '用户不存在' });
    if (user.status === 'banned') return res.status(403).json({ message: '账号已被封禁，请联系管理员' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
}

// 登录可选（携带 token 则解析，不携带也放行）
export function authOptional(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
      if (user && user.status !== 'banned') req.user = user;
    } catch { /* 无效 token 忽略，按游客处理 */ }
  }
  next();
}

// 必须是管理员
export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '无权限，需要管理员身份' });
  }
  next();
}
