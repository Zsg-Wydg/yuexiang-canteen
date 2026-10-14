// 独立初始化入口：node src/init-db.js
// 删除 data/app.db 后执行可重置全部演示数据
import './db.js';
import { ensureSeedImages } from './seed-images.js';

ensureSeedImages();
console.log('数据库初始化完成（演示账号：admin/admin123；alice、bob 为学生；chuancook、yuecook、qingfood、naicha 为商家，密码均为 123456）');
