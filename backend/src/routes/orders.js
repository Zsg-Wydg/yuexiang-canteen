// 点餐订单接口：下单 / 我的订单 / 商家接单 / 顾客确认取餐
import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function genOrderNo() {
  return 'SG' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 900 + 100);
}

function attachProduct(order) {
  const p = db.prepare('SELECT id, title, price, images, status, seller_id FROM products WHERE id = ?').get(order.product_id);
  return {
    ...order,
    product: p ? { ...p, images: JSON.parse(p.images || '[]') } : null,
    buyer: db.prepare('SELECT id, nickname, avatar, phone FROM users WHERE id = ?').get(order.buyer_id),
    seller: db.prepare('SELECT id, nickname, avatar, phone FROM users WHERE id = ?').get(order.seller_id)
  };
}

// 下单
router.post('/', authRequired, (req, res) => {
  const productId = Number(req.body?.productId);
  const remark = (req.body?.remark || '').trim().slice(0, 100);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ message: '菜品不存在' });
  if (product.seller_id === req.user.id) return res.status(400).json({ message: '不能点自己发布的菜品' });
  if (product.status !== 'on') return res.status(400).json({ message: '该菜品当前不可下单（已售罄或已下架）' });

  // 已有进行中的订单则不允许重复下单
  const dup = db.prepare(`
    SELECT id FROM orders WHERE product_id = ? AND buyer_id = ? AND status IN ('pending', 'agreed')
  `).get(productId, req.user.id);
  if (dup) return res.status(409).json({ message: '你已有一笔该菜品的进行中订单' });

  const t = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO orders (order_no, product_id, buyer_id, seller_id, price, remark, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(genOrderNo(), productId, req.user.id, product.seller_id, product.price, remark, t, t);

  res.status(201).json(attachProduct(db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid)));
});

// 我的订单（role=buyer 买到的 / seller 卖出的，默认全部）
router.get('/', authRequired, (req, res) => {
  const { role, status } = req.query;
  const where = [];
  const params = {};
  if (role === 'buyer') where.push('o.buyer_id = $me');
  else if (role === 'seller') where.push('o.seller_id = $me');
  else where.push('(o.buyer_id = $me OR o.seller_id = $me)');
  params.$me = req.user.id;
  if (status) { where.push('o.status = $status'); params.$status = status; }

  const rows = db.prepare(`
    SELECT o.* FROM orders o WHERE ${where.join(' AND ')} ORDER BY o.created_at DESC
  `).all(params);
  res.json(rows.map(attachProduct));
});

// 订单状态流转
router.patch('/:id', authRequired, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  const { action } = req.body || {};
  const isBuyer = order.buyer_id === req.user.id;
  const isSeller = order.seller_id === req.user.id;
  if (!isBuyer && !isSeller) return res.status(403).json({ message: '无权操作该订单' });

  let nextStatus;
  if (action === 'cancel') {
    if (!isBuyer) return res.status(403).json({ message: '只有下单顾客可以取消订单' });
    if (!['pending', 'agreed'].includes(order.status)) return res.status(400).json({ message: '当前状态无法取消' });
    nextStatus = 'canceled';
  } else if (action === 'agree') {
    if (!isSeller) return res.status(403).json({ message: '只有商家可以接单' });
    if (order.status !== 'pending') return res.status(400).json({ message: '当前状态无法操作' });
    nextStatus = 'agreed';
  } else if (action === 'reject') {
    if (!isSeller) return res.status(403).json({ message: '只有商家可以拒单' });
    if (order.status !== 'pending') return res.status(400).json({ message: '当前状态无法操作' });
    nextStatus = 'rejected';
  } else if (action === 'complete') {
    if (!isBuyer) return res.status(403).json({ message: '只有下单顾客可以确认取餐' });
    if (order.status !== 'agreed') return res.status(400).json({ message: '商家接单后才能确认完成' });
    nextStatus = 'completed';
  } else {
    return res.status(400).json({ message: '非法操作' });
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
    .run(nextStatus, new Date().toISOString(), order.id);
  // 订单完成：菜品标记为已售罄（今日售完）
  if (nextStatus === 'completed') {
    db.prepare("UPDATE products SET status = 'sold' WHERE id = ?").run(order.product_id);
  }
  res.json(attachProduct(db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id)));
});

export default router;
