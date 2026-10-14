// 生成演示用的本地 SVG 占位图（渐变背景 + emoji + 菜品名称）
// 首次初始化数据库时自动写入 uploads/seed，保证离线环境也能看到菜品图片
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, '..', 'uploads', 'seed');

const GRADIENTS = [
  ['#ffd194', '#f0823e'],
  ['#ff9a9e', '#e0585a'],
  ['#ffc46b', '#e8890c'],
  ['#fbc2eb', '#c471d6'],
  ['#a1e8a8', '#2ea36a'],
  ['#c7f5c2', '#6bbf59'],
  ['#d0b3ff', '#8a5cf6'],
  ['#ffe29f', '#ffa751'],
  ['#fcd5ce', '#f4845f'],
  ['#fff1a8', '#f4b72c'],
  ['#ffb199', '#e4564f'],
  ['#ff8e8e', '#c0392b']
];

function productSvg(emoji, label, colors) {
  const [c1, c2] = colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <circle cx="400" cy="250" r="150" fill="rgba(255,255,255,0.22)"/>
  <text x="400" y="320" font-size="170" text-anchor="middle">&#${emoji};</text>
  <text x="400" y="470" font-size="46" fill="#ffffff" text-anchor="middle"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-weight="bold">${label}</text>
</svg>`;
}

const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb199"/>
      <stop offset="1" stop-color="#e4564f"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#g)"/>
  <circle cx="100" cy="78" r="34" fill="rgba(255,255,255,0.92)"/>
  <path d="M40 170 a60 60 0 0 1 120 0 z" fill="rgba(255,255,255,0.92)"/>
</svg>`;

// emoji 使用 HTML 数字实体，避免文件编码问题
const SEED_PRODUCTS = [
  { file: 'd1.svg', emoji: '127835', label: '黄焖鸡米饭' },
  { file: 'd2.svg', emoji: '127858', label: '麻婆豆腐盖饭' },
  { file: 'd3.svg', emoji: '127857', label: '叉烧双拼饭' },
  { file: 'd4.svg', emoji: '129375', label: '虾仁肠粉' },
  { file: 'd5.svg', emoji: '129367', label: '藜麦鸡胸沙拉' },
  { file: 'd6.svg', emoji: '127791', label: '全麦鸡胸卷' },
  { file: 'd7.svg', emoji: '129475', label: '黑糖珍珠奶茶' },
  { file: 'd8.svg', emoji: '129389', label: '杨枝甘露' },
  { file: 'd9.svg', emoji: '127856', label: '芒果班戟' },
  { file: 'd10.svg', emoji: '127839', label: '狼牙土豆' },
  { file: 'd11.svg', emoji: '127836', label: '番茄牛腩面' },
  { file: 'd12.svg', emoji: '129385', label: '水煮牛肉' }
];

export function ensureSeedImages() {
  fs.mkdirSync(SEED_DIR, { recursive: true });
  const avatarPath = path.join(SEED_DIR, 'avatar.svg');
  if (!fs.existsSync(avatarPath)) fs.writeFileSync(avatarPath, avatarSvg, 'utf-8');
  SEED_PRODUCTS.forEach((p, i) => {
    const fp = path.join(SEED_DIR, p.file);
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, productSvg(p.emoji, p.label, GRADIENTS[i % GRADIENTS.length]), 'utf-8');
    }
  });
}
