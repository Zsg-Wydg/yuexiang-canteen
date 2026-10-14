// 端到端冒烟测试：覆盖注册/登录/发布/上传/下单/订单流转/留言/收藏/后台权限/SPA 托管
const BASE = 'http://localhost:3000';
let pass = 0;
function ok(cond, msg) {
  if (!cond) { console.error('❌ FAIL:', msg); process.exitCode = 1; process.exit(1); }
  console.log('✅', msg);
  pass++;
}
async function api(method, url, token, body, isRaw) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {})
    },
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

// 1. 注册新用户
const uname = 'tester' + Math.floor(Math.random() * 100000);
let r = await api('POST', '/api/auth/register', null, { username: uname, password: 'abc123', nickname: '测试同学' });
ok(r.status === 201 && r.data.token, '注册成功并返回 token');
const testerToken = r.data.token;

// 2. 重复注册 -> 409
r = await api('POST', '/api/auth/register', null, { username: uname, password: 'abc123' });
ok(r.status === 409, '重复用户名被拒绝');

// 3. 错误密码登录 -> 401
r = await api('POST', '/api/auth/login', null, { username: uname, password: 'wrong' });
ok(r.status === 401, '错误密码登录失败');

// 4. 未登录访问收藏 -> 401
r = await api('GET', '/api/favorites');
ok(r.status === 401, '未登录访问受保护接口返回 401');

// 5. bob 登录并发布商品
r = await api('POST', '/api/auth/login', null, { username: 'bob', password: '123456' });
ok(r.status === 200, 'bob 登录成功');
const bobToken = r.data.token;

// 5b. 图片上传（FormData）
import { readFileSync } from 'node:fs';
const fd = new FormData();
fd.append('file', new Blob([readFileSync('uploads/seed/d7.svg')], { type: 'image/svg+xml' }), 'd7.svg');
r = await api('POST', '/api/upload', bobToken, fd);
ok(r.status === 201 && r.data.url?.startsWith('/uploads/'), '菜品图片上传成功');

r = await api('POST', '/api/products', bobToken, {
  title: 'E2E测试菜品-麻辣香锅',
  description: '端到端测试用，麻辣香锅小份，食材新鲜。',
  price: 26, original_price: 38, category: '招牌热菜',
  item_condition: '香辣开胃', images: [r.data.url]
});
ok(r.status === 201 && r.data.id, 'bob 上架菜品成功');
const pid = r.data.id;

// 6. tester 下单
r = await api('POST', '/api/orders', testerToken, { productId: pid, remark: '晚上面交' });
ok(r.status === 201 && r.data.status === 'pending', '买家下单成功（pending）');
const oid = r.data.id;

// 7. 重复下单 -> 409
r = await api('POST', '/api/orders', testerToken, { productId: pid, remark: '再下一单' });
ok(r.status === 409, '进行中订单重复下单被拒绝');

// 8. 买家不能同意订单
r = await api('PATCH', `/api/orders/${oid}`, testerToken, { action: 'agree' });
ok(r.status === 403, '买家无权同意订单');

// 9. bob 同意 -> 其他商家无法操作别人的订单
const thirdLogin = await api('POST', '/api/auth/login', null, { username: 'qingfood', password: '123456' });
r = await api('PATCH', `/api/orders/${oid}`, thirdLogin.data.token, { action: 'agree' });
ok(r.status === 403, '第三方无法操作订单');

// 10. bob 同意订单
r = await api('PATCH', `/api/orders/${oid}`, bobToken, { action: 'agree' });
ok(r.status === 200 && r.data.status === 'agreed', '卖家同意订单（agreed）');

// 11. 买家确认完成，商品自动变为已售
r = await api('PATCH', `/api/orders/${oid}`, testerToken, { action: 'complete' });
ok(r.status === 200 && r.data.status === 'completed', '买家确认收货（completed）');
r = await api('GET', `/api/products/${pid}`);
ok(r.data.status === 'sold', '订单完成后商品自动标记为已售出');

// 12. 留言
r = await api('POST', '/api/comments', testerToken, { productId: pid, content: '键盘还有保修吗？' });
ok(r.status === 201, '发表留言成功');
const cid = r.data.id;
r = await api('GET', `/api/comments?productId=${pid}`);
ok(r.status === 200 && r.data.some((c) => c.id === cid), '留言列表包含新留言');

// 13. 收藏切换
r = await api('POST', '/api/favorites/toggle', testerToken, { productId: pid });
ok(r.status === 201 && r.data.favored === true, '收藏成功');
r = await api('POST', '/api/favorites/toggle', testerToken, { productId: pid });
ok(r.data.favored === false, '再次切换取消收藏');

// 14. 不能点自己发布的菜品
r = await api('POST', '/api/orders', bobToken, { productId: pid });
ok(r.status === 400, '点自己发布的菜品被拒绝');

// 15. 管理员统计与权限
const adminLogin = await api('POST', '/api/auth/login', null, { username: 'admin', password: 'admin123' });
r = await api('GET', '/api/admin/stats', adminLogin.data.token);
ok(r.status === 200 && r.data.users >= 5 && r.data.products >= 12, '管理员可查看统计数据');
r = await api('GET', '/api/admin/stats', testerToken);
ok(r.status === 403, '普通用户访问后台被拒绝');

// 16. 单端口托管前端（构建后的 SPA）
const home = await fetch(BASE + '/');
const html = await home.text();
ok(home.status === 200 && html.includes('<div id="app">'), '后端单端口托管前端页面');

// 17. 关键字搜索
r = await api('GET', '/api/products?keyword=奶茶');
ok(r.data.total >= 1 && r.data.list[0].title.includes('奶茶'), '菜品关键字搜索正常');

console.log(`\n🎉 全部 ${pass} 项端到端测试通过`);
