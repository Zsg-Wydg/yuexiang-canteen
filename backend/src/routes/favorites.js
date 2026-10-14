// 收藏相关接口
import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// 我的收藏列表
router.get('/', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT p.* FROM favorites f
    JOIN products p ON p.id = f.product_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);
  const list = rows.map((r) => ({
    ...r,
    images: JSON.parse(r.images || '[]'),
    is_favored: true,
    seller: db.prepare('SELECT id, nickname, avatar FROM users WHERE id = ?').get(r.seller_id)
  }));
  res.json(list);
});

// 收藏 / 取消收藏（幂等切换）
router.post('/toggle', authRequired, (req, res) => {
  const productId = Number(req.body?.productId);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ message: '菜品不存在' });

  const existed = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);
  if (existed) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existed.id);
    db.prepare('UPDATE products SET favorite_count = MAX(favorite_count - 1, 0) WHERE id = ?').run(productId);
    return res.json({ favored: false, favorite_count: Math.max(product.favorite_count - 1, 0) });
  }
  db.prepare('INSERT INTO favorites (user_id, product_id, created_at) VALUES (?, ?, ?)')
    .run(req.user.id, productId, new Date().toISOString());
  db.prepare('UPDATE products SET favorite_count = favorite_count + 1 WHERE id = ?').run(productId);
  res.status(201).json({ favored: true, favorite_count: product.favorite_count + 1 });
});

export default router;
