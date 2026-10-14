// 商品留言（问答）接口
import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// 某菜品的留言列表
router.get('/', (req, res) => {
  const productId = Number(req.query.productId);
  if (!productId) return res.status(400).json({ message: '缺少菜品 ID' });
  const rows = db.prepare(`
    SELECT c.id, c.content, c.created_at, c.user_id, u.nickname, u.avatar
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.product_id = ?
    ORDER BY c.created_at ASC
  `).all(productId);
  res.json(rows);
});

// 发表留言
router.post('/', authRequired, (req, res) => {
  const productId = Number(req.body?.productId);
  const content = (req.body?.content || '').trim();
  if (!productId) return res.status(400).json({ message: '缺少菜品 ID' });
  if (!content) return res.status(400).json({ message: '留言内容不能为空' });
  if (content.length > 200) return res.status(400).json({ message: '留言不能超过 200 字' });
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ message: '菜品不存在' });

  const result = db.prepare('INSERT INTO comments (product_id, user_id, content, created_at) VALUES (?, ?, ?, ?)')
    .run(productId, req.user.id, content, new Date().toISOString());
  res.status(201).json({
    id: result.lastInsertRowid, content, product_id: productId,
    created_at: new Date().toISOString(), user_id: req.user.id,
    nickname: req.user.nickname, avatar: req.user.avatar
  });
});

// 删除留言（本人或管理员）
router.delete('/:id', authRequired, (req, res) => {
  const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: '留言不存在' });
  if (row.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: '只能删除自己的留言' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(row.id);
  res.json({ message: '删除成功' });
});

export default router;
