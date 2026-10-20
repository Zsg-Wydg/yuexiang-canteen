// 管理员接口：数据统计 / 用户管理 / 全站商品管理
import { Router } from 'express';
import { db } from '../db.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired, adminRequired);

// 首页统计卡片
router.get('/stats', (req, res) => {
  const users = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'user'").get().c;
  const products = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  const onSale = db.prepare("SELECT COUNT(*) AS c FROM products WHERE status = 'on'").get().c;
  const orders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const completed = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'completed'").get().c;
  // 近 7 天每日新增商品
  const trend = db.prepare(`
    SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count
    FROM products
    WHERE created_at >= ?
    GROUP BY date ORDER BY date
  `).all(new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10));
  const categoryRows = db.prepare('SELECT category, COUNT(*) AS count FROM products GROUP BY category').all();
  res.json({ users, products, onSale, orders, completed, trend, categories: categoryRows });
});

// 用户列表
router.get('/users', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = 10;
  const keyword = req.query.keyword || '';
  const where = keyword ? 'WHERE username LIKE $kw OR nickname LIKE $kw' : '';
  const params = keyword ? { $kw: `%${keyword}%` } : {};
  const total = db.prepare(`SELECT COUNT(*) AS c FROM users ${where}`).get(params).c;
  const rows = db.prepare(`
    SELECT id, username, nickname, phone, role, status, created_at,
      (SELECT COUNT(*) FROM products WHERE seller_id = users.id) AS product_count
    FROM users ${where}
    ORDER BY id ASC LIMIT $limit OFFSET $offset
  `).all({ ...params, $limit: pageSize, $offset: (page - 1) * pageSize });
  res.json({ total, page, list: rows });
});

// 封禁 / 解封用户
router.patch('/users/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['active', 'banned'].includes(status)) return res.status(400).json({ message: '非法状态' });
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ message: '用户不存在' });
  if (u.role === 'admin') return res.status(400).json({ message: '不能封禁管理员账号' });
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, u.id);
  res.json({ id: u.id, status });
});

// 删除用户
router.delete('/users/:id', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ message: '用户不存在' });
  if (u.role === 'admin') return res.status(400).json({ message: '不能删除管理员账号' });
  db.prepare('DELETE FROM users WHERE id = ?').run(u.id);
  res.json({ message: '删除成功' });
});

// 全站商品列表
router.get('/products', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = 10;
  const where = [];
  const params = {};
  if (req.query.keyword) { where.push('(p.title LIKE $kw)'); params.$kw = `%${req.query.keyword}%`; }
  if (['on', 'off', 'sold'].includes(req.query.status)) { where.push('p.status = $status'); params.$status = req.query.status; }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) AS c FROM products p ${whereSql}`).get(params).c;
  const rows = db.prepare(`
    SELECT p.*, u.nickname AS seller_name
    FROM products p JOIN users u ON u.id = p.seller_id
    ${whereSql} ORDER BY p.created_at DESC LIMIT $limit OFFSET $offset
  `).all({ ...params, $limit: pageSize, $offset: (page - 1) * pageSize });
  res.json({
    total, page,
    list: rows.map((r) => ({ ...r, images: JSON.parse(r.images || '[]') }))
  });
});

// 管理员修改商品状态
router.patch('/products/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['on', 'off', 'sold'].includes(status)) return res.status(400).json({ message: '非法状态' });
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ message: '菜品不存在' });
  db.prepare('UPDATE products SET status = ? WHERE id = ?').run(status, p.id);
  res.json({ id: p.id, status });
});

// 管理员删除商品
router.delete('/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

// 全站交易订单列表
router.get('/orders', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = 10;
  const where = [];
  const params = {};
  if (req.query.keyword) {
    where.push('(o.order_no LIKE $kw OR p.title LIKE $kw OR ub.nickname LIKE $kw OR us.nickname LIKE $kw)');
    params.$kw = `%${req.query.keyword}%`;
  }
  if (['pending', 'agreed', 'rejected', 'completed', 'canceled'].includes(req.query.status)) {
    where.push('o.status = $status');
    params.$status = req.query.status;
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`
    SELECT COUNT(*) AS c FROM orders o
    JOIN users ub ON ub.id = o.buyer_id
    JOIN users us ON us.id = o.seller_id
    JOIN products p ON p.id = o.product_id
    ${whereSql}
  `).get(params).c;
  const rows = db.prepare(`
    SELECT o.id, o.order_no, o.product_id, o.buyer_id, o.seller_id, o.price, o.remark,
           o.status, o.created_at, o.updated_at,
           p.title AS product_title, p.images AS product_images,
           ub.nickname AS buyer_name, us.nickname AS seller_name
    FROM orders o
    JOIN users ub ON ub.id = o.buyer_id
    JOIN users us ON us.id = o.seller_id
    JOIN products p ON p.id = o.product_id
    ${whereSql}
    ORDER BY o.created_at DESC
    LIMIT $limit OFFSET $offset
  `).all({ ...params, $limit: pageSize, $offset: (page - 1) * pageSize });
  res.json({
    total, page,
    list: rows.map((r) => ({ ...r, product_images: JSON.parse(r.product_images || '[]') }))
  });
});

// 管理员删除订单
router.delete('/orders/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ message: '订单不存在' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(o.id);
  res.json({ message: '删除成功' });
});

export default router;
