// 用户相关接口：公开资料 / 修改资料 / 修改密码
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// 用户公开主页信息 + 在售商品数
router.get('/:id', (req, res) => {
  const u = db.prepare('SELECT id, username, nickname, avatar, phone, bio, role, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ message: '用户不存在' });
  const onSale = db.prepare("SELECT COUNT(*) AS c FROM products WHERE seller_id = ? AND status = 'on'").get(u.id).c;
  const sold = db.prepare("SELECT COUNT(*) AS c FROM products WHERE seller_id = ? AND status = 'sold'").get(u.id).c;
  res.json({ ...u, on_sale_count: onSale, sold_count: sold });
});

// 修改个人资料
router.put('/profile', authRequired, (req, res) => {
  const { nickname, avatar, phone, bio } = req.body || {};
  if (!nickname || !nickname.trim()) return res.status(400).json({ message: '昵称不能为空' });
  db.prepare('UPDATE users SET nickname = ?, avatar = ?, phone = ?, bio = ? WHERE id = ?')
    .run(nickname.trim(), avatar || req.user.avatar, phone || '', bio || '', req.user.id);
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({
    id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar,
    phone: u.phone, bio: u.bio, role: u.role, status: u.status, created_at: u.created_at
  });
});

// 修改密码
router.put('/password', authRequired, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ message: '请填写完整的密码信息' });
  if (!bcrypt.compareSync(oldPassword, req.user.password)) {
    return res.status(400).json({ message: '原密码不正确' });
  }
  if (newPassword.length < 6) return res.status(400).json({ message: '新密码长度至少 6 位' });
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: '密码修改成功' });
});

export default router;
