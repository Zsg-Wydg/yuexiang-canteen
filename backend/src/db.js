// 数据库连接与初始化（SQLite，Node 22+ 内置 node:sqlite，无需额外安装数据库）
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { ensureSeedImages } from './seed-images.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, 'app.db'));
db.exec('PRAGMA foreign_keys = ON;');

// ---------------- 建表 ----------------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  nickname   TEXT NOT NULL,
  avatar     TEXT DEFAULT '/uploads/seed/avatar.svg',
  phone      TEXT DEFAULT '',
  bio        TEXT NOT NULL DEFAULT '这位同学很懒，什么都没留下~',
  role       TEXT NOT NULL DEFAULT 'user',          -- user / admin
  status     TEXT NOT NULL DEFAULT 'active',        -- active / banned
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id      INTEGER NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  price          REAL NOT NULL,
  original_price REAL NOT NULL DEFAULT 0,
  category       TEXT NOT NULL,
  item_condition TEXT NOT NULL DEFAULT '咸香家常',
  images         TEXT NOT NULL DEFAULT '[]',        -- JSON 数组
  status         TEXT NOT NULL DEFAULT 'on',        -- on 供应中 / off 已下架 / sold 已售罄
  view_count     INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no   TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL,
  buyer_id   INTEGER NOT NULL,
  seller_id  INTEGER NOT NULL,
  price      REAL NOT NULL,
  remark     TEXT DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending', -- pending 待接单 / agreed 已接单 / rejected 已拒单 / completed 已完成 / canceled 已取消
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
`);

// ---------------- 种子数据 ----------------
function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return; // 已有数据则不重复初始化

  ensureSeedImages();
  const hash = (pwd) => bcrypt.hashSync(pwd, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, nickname, avatar, phone, bio, role, status, created_at)
    VALUES (?, ?, ?, '/uploads/seed/avatar.svg', ?, ?, ?, 'active', ?)
  `);
  const users = [
    { u: 'admin', p: 'admin123', n: '平台管理员', phone: '13800000000', bio: '悦享食堂官方管理员，负责商家资质审核与平台秩序维护。', role: 'admin' },
    { u: 'alice', p: '123456', n: '小鹿同学', phone: '13811112222', bio: '干饭积极分子，每天纠结吃什么，收藏了一堆好吃的～', role: 'user' },
    { u: 'bob', p: '123456', n: 'Bob爱吃饭', phone: '13833334444', bio: '无辣不欢的大三学生，最爱食堂二楼川菜窗口。', role: 'user' },
    { u: 'chuancook', p: '123456', n: '川香小厨', phone: '13855001111', bio: '食堂二楼川菜窗口，十年老师傅掌勺，麻辣鲜香、现炒现卖，欢迎提前下单到店即取。', role: 'user' },
    { u: 'yuecook', p: '123456', n: '粤味烧腊档', phone: '13855002222', bio: '食堂一楼粤式窗口，烧腊卤味、肠粉粥面，口味清淡，食材每日新鲜配送。', role: 'user' },
    { u: 'qingfood', p: '123456', n: '轻食研究所', phone: '13855003333', bio: '低卡轻食专门店，健身减脂人群的好选择，酱料可换油醋汁。', role: 'user' },
    { u: 'naicha', p: '123456', n: '奶茶研究所', phone: '13855004444', bio: '校门口饮品甜点店，奶茶小料任选，甜度冰度可备注，下课来一杯！', role: 'user' }
  ];
  users.forEach((x, i) => insertUser.run(x.u, hash(x.p), x.n, x.phone, x.bio, x.role, daysAgo(30 - i * 3)));

  const insertProduct = db.prepare(`
    INSERT INTO products
      (seller_id, title, description, price, original_price, category, item_condition, images, status, view_count, created_at)
    VALUES (@seller_id, @title, @description, @price, @original_price, @category, @item_condition, @images, @status, @view_count, @created_at)
  `);

  const img = (f) => JSON.stringify([`/uploads/seed/${f}`]);
  const products = [
    { seller_id: 4, title: '招牌黄焖鸡米饭', description: '鸡腿肉现焖，汤汁浓郁，配青椒香菇，内含米饭一份。中辣口味，不吃辣可备注免辣，出餐后请尽快取餐。', price: 16, original_price: 22, category: '招牌热菜', item_condition: '香辣开胃', images: img('d1.svg'), status: 'on', view_count: 328, created_at: daysAgo(9) },
    { seller_id: 4, title: '麻婆豆腐盖饭', description: '嫩豆腐配牛肉末，麻辣鲜香，浇在米饭上十分下饭。每份现点现做，约 8 分钟出餐。', price: 12, original_price: 18, category: '招牌热菜', item_condition: '香辣开胃', images: img('d2.svg'), status: 'on', view_count: 256, created_at: daysAgo(8) },
    { seller_id: 5, title: '蜜汁叉烧双拼饭', description: '蜜汁叉烧+白切鸡双拼，配烫青菜和例汤。叉烧每日现烧，皮香肉嫩，双拼分量十足。', price: 18, original_price: 26, category: '粉面粥饭', item_condition: '咸香家常', images: img('d3.svg'), status: 'on', view_count: 402, created_at: daysAgo(7) },
    { seller_id: 5, title: '现蒸虾仁肠粉', description: '布拉肠粉皮薄爽滑，整只虾仁，配自制豉油。早餐时段供应，可提前一晚预订第二天早餐。', price: 11, original_price: 16, category: '粉面粥饭', item_condition: '清淡健康', images: img('d4.svg'), status: 'on', view_count: 188, created_at: daysAgo(6) },
    { seller_id: 6, title: '鸡胸肉藜麦沙拉', description: '低脂高蛋白组合：水煮鸡胸、三色藜麦、时蔬坚果，配油醋汁，约 350 大卡。健身减脂首选。', price: 22, original_price: 32, category: '轻食沙拉', item_condition: '清淡健康', images: img('d5.svg'), status: 'on', view_count: 274, created_at: daysAgo(5) },
    { seller_id: 6, title: '牛油果鸡胸全麦卷', description: '全麦饼皮卷煎鸡胸、牛油果、生菜番茄，饱腹感强，酱料可选低脂酸奶酱。', price: 19, original_price: 28, category: '轻食沙拉', item_condition: '清淡健康', images: img('d6.svg'), status: 'on', view_count: 196, created_at: daysAgo(5) },
    { seller_id: 7, title: '黑糖珍珠奶茶', description: '手作黑糖珍珠挂壁，香浓奶茶底，甜度冰度均可备注。下课高峰期请提前下单免排队。', price: 12, original_price: 18, category: '奶茶饮品', item_condition: '香甜可口', images: img('d7.svg'), status: 'on', view_count: 633, created_at: daysAgo(4) },
    { seller_id: 7, title: '杨枝甘露', description: '新鲜芒果、西柚粒配椰浆西米，酸甜清爽，冰饮最佳。每日限量 50 杯。', price: 15, original_price: 22, category: '奶茶饮品', item_condition: '香甜可口', images: img('d8.svg'), status: 'on', view_count: 421, created_at: daysAgo(3) },
    { seller_id: 7, title: '港式芒果班戟', description: '新鲜芒果块配动物奶油，薄饼皮冷藏口感更佳，适合下午茶甜品，第二份半价。', price: 13, original_price: 20, category: '甜点小吃', item_condition: '香甜可口', images: img('d9.svg'), status: 'on', view_count: 178, created_at: daysAgo(3) },
    { seller_id: 4, title: '狼牙土豆（大份）', description: '现炸土豆拌折耳根、香菜和秘制辣椒面，香辣过瘾，是川菜窗口的人气小食。', price: 8, original_price: 12, category: '甜点小吃', item_condition: '香辣开胃', images: img('d10.svg'), status: 'on', view_count: 312, created_at: daysAgo(2) },
    { seller_id: 5, title: '番茄牛腩面', description: '牛腩慢炖两小时，番茄汤底浓郁，配手工面和烫青菜，暖胃又顶饱。', price: 17, original_price: 25, category: '粉面粥饭', item_condition: '咸香家常', images: img('d11.svg'), status: 'on', view_count: 245, created_at: daysAgo(2) },
    { seller_id: 4, title: '招牌水煮牛肉', description: '大片牛肉配豆芽莴笋，红油麻辣、分量扎实，适合两人拼单。今日午市限量 30 份。', price: 28, original_price: 42, category: '招牌热菜', item_condition: '香辣开胃', images: img('d12.svg'), status: 'on', view_count: 389, created_at: daysAgo(1) }
  ];
  products.forEach((p) => insertProduct.run(p));

  // 收藏
  const insertFav = db.prepare('INSERT INTO favorites (user_id, product_id, created_at) VALUES (?, ?, ?)');
  [
    [2, 7], [2, 9], [2, 3], [3, 1], [3, 12], [3, 10], [2, 8], [3, 5], [2, 11]
  ].forEach(([u, p], i) => {
    insertFav.run(u, p, daysAgo(2 - i * 0.1));
    db.prepare('UPDATE products SET favorite_count = favorite_count + 1 WHERE id = ?').run(p);
  });

  // 菜品评价 / 留言
  const insertComment = db.prepare('INSERT INTO comments (product_id, user_id, content, created_at) VALUES (?, ?, ?, ?)');
  [
    [7, 3, '三分糖少冰可以做吗？中午 12 点下课来取。', daysAgo(2)],
    [7, 7, '可以的同学，下单时备注三分糖少冰就行，我们提前做好放取餐架～', daysAgo(2)],
    [1, 2, '黄焖鸡微辣够味，肉很多！就是饭点人有点多。', daysAgo(2)],
    [1, 4, '谢谢喜欢！饭点建议提前 15 分钟线上点单，到店即取不用等。', daysAgo(1)],
    [5, 3, '请问沙拉可以不要洋葱吗？在减脂期。', daysAgo(1)],
    [5, 6, '没问题，下单备注“去洋葱”即可，酱汁也可以换成零卡油醋汁。', daysAgo(1)],
    [12, 2, '水煮牛肉辣度怎么样？不太能吃辣的人顶得住吗？', daysAgo(1)]
  ].forEach(([p, u, c, t]) => insertComment.run(p, u, c, t));

  // 订单：一笔已完成（水煮牛肉 -> 售罄），一笔待商家接单（珍珠奶茶）
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, product_id, buyer_id, seller_id, price, remark, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run('YX20261013001', 12, 2, 4, 28, '微辣，两份米饭，12:05 到窗口取。', 'completed', daysAgo(1), daysAgo(1));
  db.prepare("UPDATE products SET status = 'sold' WHERE id = 12").run();
  insertOrder.run('YX20261014002', 7, 3, 7, 12, '三分糖去冰，12:20 下课后到取餐架拿。', 'pending', new Date(Date.now() - 2 * 3600000).toISOString(), new Date(Date.now() - 2 * 3600000).toISOString());
}

// 独立执行时可重新初始化（npm run init）
seed();

export default db;
