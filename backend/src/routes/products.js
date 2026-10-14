// 商品相关接口：列表搜索 / 详情 / 发布 / 编辑 / 上下架 / 删除
import { Router } from 'express';
import { db } from '../db.js';
import { CATEGORIES, CONDITIONS } from '../config.js';
import { authRequired, authOptional } from '../middleware/auth.js';

const router = Router();

function parseProduct(row, userId) {
  if (!row) return null;
  const seller = db.prepare('SELECT id, username, nickname, avatar, phone, bio FROM users WHERE id = ?').get(row.seller_id);
  let is_favored = false;
  if (userId) {
    is_favored = !!db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(userId, row.id);
  }
  return {
    ...row,
    images: JSON.parse(row.images || '[]'),
    seller,
    is_favored
  };
}

// 商品列表：关键字 / 分类 / 排序 / 分页
router.get('/', authOptional, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 12));
  const { keyword, category, status, sellerId, sort } = req.query;

  const where = [];
  const params = {};
  if (status) {
    where.push('p.status = $status');
    params.$status = status;
  } else {
    where.push("p.status != 'off'"); // 默认列表不看已下架
  }
  if (category && CATEGORIES.includes(category)) {
    where.push('p.category = $category');
    params.$category = category;
  }
  if (sellerId) {
    where.push('p.seller_id = $sellerId');
    params.$sellerId = Number(sellerId);
  }
  if (keyword) {
    where.push('(p.title LIKE $kw OR p.description LIKE $kw)');
    params.$kw = `%${keyword}%`;
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  let orderSql = 'p.created_at DESC';
  if (sort === 'price_asc') orderSql = 'p.price ASC';
  else if (sort === 'price_desc') orderSql = 'p.price DESC';
  else if (sort === 'hot') orderSql = 'p.view_count DESC';

  const total = db.prepare(`SELECT COUNT(*) AS c FROM products p ${whereSql}`).get(params).c;
  const rows = db.prepare(`
    SELECT p.* FROM products p ${whereSql}
    ORDER BY ${orderSql}
    LIMIT $limit OFFSET $offset
  `).all({ ...params, $limit: pageSize, $offset: (page - 1) * pageSize });

  res.json({ total, page, pageSize, list: rows.map((r) => parseProduct(r, req.user?.id)) });
});

// 我发布的商品
router.get('/mine', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map((r) => parseProduct(r, req.user.id)));
});

// 商品详情（浏览量 +1）
router.get('/:id', authOptional, (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: '菜品不存在或已被删除' });
  db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').run(row.id);
  row.view_count += 1;
  res.json(parseProduct(row, req.user?.id));
});

function validateBody(body) {
  const { title, price, category, item_condition, images } = body;
  if (!title || title.trim().length < 2) return '菜品名称至少 2 个字';
  if (price == null || isNaN(price) || Number(price) < 0 || Number(price) > 999999) return '请输入合法价格';
  if (!CATEGORIES.includes(category)) return '请选择菜品分类';
  if (!CONDITIONS.includes(item_condition)) return '请选择风味标签';
  if (images && (!Array.isArray(images) || images.length > 3)) return '最多上传 3 张图片';
  return null;
}

// 发布商品
router.post('/', authRequired, (req, res) => {
  const err = validateBody(req.body);
  if (err) return res.status(400).json({ message: err });
  const { title, description = '', price, original_price = 0, category, item_condition, images = [] } = req.body;
  const result = db.prepare(`
    INSERT INTO products
      (seller_id, title, description, price, original_price, category, item_condition, images, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'on', ?)
  `).run(
    req.user.id, title.trim(), description, Number(price), Number(original_price) || 0,
    category, item_condition, JSON.stringify(images), new Date().toISOString()
  );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(parseProduct(row, req.user.id));
});

function loadOwnedProduct(req, res) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ message: '菜品不存在或已被删除' });
    return null;
  }
  if (row.seller_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ message: '只能操作自己发布的菜品' });
    return null;
  }
  return row;
}

// 编辑商品
router.put('/:id', authRequired, (req, res) => {
  const row = loadOwnedProduct(req, res);
  if (!row) return;
  const err = validateBody({ ...row, ...req.body });
  if (err) return res.status(400).json({ message: err });
  const { title, description = '', price, original_price = 0, category, item_condition, images } = req.body;
  db.prepare(`
    UPDATE products SET title=?, description=?, price=?, original_price=?, category=?, item_condition=?, images=?
    WHERE id=?
  `).run(
    title.trim(), description, Number(price), Number(original_price) || 0,
    category, item_condition, JSON.stringify(images || JSON.parse(row.images)), row.id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(row.id);
  res.json(parseProduct(updated, req.user.id));
});

// 上架 / 下架 / 标记已售
router.patch('/:id/status', authRequired, (req, res) => {
  const row = loadOwnedProduct(req, res);
  if (!row) return;
  const { status } = req.body || {};
  if (!['on', 'off', 'sold'].includes(status)) return res.status(400).json({ message: '非法状态' });
  db.prepare('UPDATE products SET status = ? WHERE id = ?').run(status, row.id);
  res.json({ id: row.id, status });
});

// 删除商品
router.delete('/:id', authRequired, (req, res) => {
  const row = loadOwnedProduct(req, res);
  if (!row) return;
  db.prepare('DELETE FROM products WHERE id = ?').run(row.id);
  res.json({ message: '删除成功' });
});

export default router;
