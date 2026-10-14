// 认证相关接口：注册 / 登录 / 当前用户信息
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function publicUser(u) {
  return {
    id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar,
    phone: u.phone, bio: u.bio, role: u.role, status: u.status, created_at: u.created_at
  };
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

// 注册
router.post('/register', (req, res) => {
  const { username, password, nickname, phone } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ message: '用户名需为 3-20 位字母、数字或下划线' });
  }
  if (password.length < 6) return res.status(400).json({ message: '密码长度至少 6 位' });
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ message: '用户名已被注册' });

  const result = db.prepare(`
    INSERT INTO users (username, password, nickname, phone, bio, role, status, created_at)
    VALUES (?, ?, ?, ?, '这位同学很懒，还没有填写个人简介~', 'user', 'active', ?)
  `).run(username, bcrypt.hashSync(password, 10), nickname || username, phone || '', new Date().toISOString());

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: '请输入用户名和密码' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  if (user.status === 'banned') return res.status(403).json({ message: '账号已被封禁，请联系管理员' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

// 获取当前登录用户
router.get('/me', authRequired, (req, res) => {
  res.json(publicUser(req.user));
});

export default router;
