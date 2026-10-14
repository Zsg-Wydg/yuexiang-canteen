# -*- coding: utf-8 -*-
"""按模板填写《Web开发技术》课程大作业报告 —— 悦享食堂（两人小组）"""
import docx
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.text.paragraph import Paragraph

SRC = r'f:\Web开发技术课程大作业报告模板.docx'
DST = r'f:\2\课程大作业报告-悦享食堂（已填写）.docx'

doc = docx.Document(SRC)


# ---------------- 工具函数 ----------------
def style_run(run, size=11, bold=False, code=False, color=None):
    run.bold = bold
    run.font.size = Pt(9 if code else size)
    run.font.name = 'Consolas' if code else 'Times New Roman'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    if color:
        run.font.color.rgb = RGBColor(*color)


def set_para(p, text, size=11, bold=False):
    for r in list(p.runs):
        r._element.getparent().remove(r._element)
    run = p.add_run()
    for i, line in enumerate(text.split('\n')):
        if i:
            run.add_break()
        run.add_text(line)
    style_run(run, size=size, bold=bold)


def insert_after(anchor, text='', bold=False, code=False):
    new_el = OxmlElement('w:p')
    anchor._p.addnext(new_el)
    p = Paragraph(new_el, anchor._parent)
    if code:
        pPr = p._p.get_or_add_pPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:fill'), 'F4F5F7')
        pPr.append(shd)
    if text:
        run = p.add_run(text)
        style_run(run, bold=bold, code=code)
    return p


def set_cell(cell, text, bold=False, size=10):
    cell.text = ''
    for i, line in enumerate(text.split('\n')):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        run = p.add_run(line)
        style_run(run, size=size, bold=bold)


def add_table_row(table, values):
    row = table.add_row()
    for cell, val in zip(row.cells, values):
        set_cell(cell, val)
    return row


def remove_row(table, idx):
    table._tbl.remove(table.rows[idx]._tr)


# ---------------- 正文段落填写 ----------------
P = doc.paragraphs

def must_replace(idx, text, **kw):
    assert P[idx].text.strip().startswith('【'), f'段落 {idx} 不是占位符: {P[idx].text[:30]}'
    set_para(P[idx], text, **kw)

set_para(P[3], '')

must_replace(43,
    '高校食堂在用餐高峰时段普遍存在排队时间长、热门窗口售罄信息不透明、商家与学生之间缺少线上沟通渠道等问题：'
    '学生往往要走到窗口才知道想吃的菜已经卖完，也无法提前告知忌口与取餐时间；食堂商家则难以提前预估需求量、'
    '减少备餐浪费。本项目“悦享食堂”是一个面向校内师生与食堂商家的校园美食点餐网站：商家可以在线上架菜品、'
    '上传实拍图、标注风味与售价并随时调整供应状态；学生能够按分类和关键字快速找到想吃的菜，'
    '通过收藏、菜品留言咨询、在线下单等功能完成“线上点单—商家接单—到店取餐”的闭环。'
    '项目目标是综合运用本课程所学的 HTML/CSS/JavaScript、Vue 前端框架与 Node.js 后端技术，'
    '完整实践前后端分离架构与 RESTful API 开发，做出一个真实可用、可部署上线、便于课堂演示的网站。')

must_replace(45,
    '目标用户群体分为三类：一是在校学生顾客，希望快速找到想吃的菜品、提前下单到店即取；'
    '二是食堂及校内餐饮商家，希望线上展示菜品、接收订单并预估备餐量；三是负责平台资质与内容审核的管理员。\n'
    '典型使用场景：\n'
    '（1）提前点单：学生中午下课前在首页搜索“奶茶”或进入“招牌热菜”分类，选好菜品后备注“微辣、不要香菜、12:20 取”，'
    '下单后直接前往取餐架，免去排队；\n'
    '（2）商家接单：食堂窗口登录后在“门店接单”中查看新订单，确认可以备餐后点击接单，菜品售罄时可随时下架或标记售罄；\n'
    '（3）咨询与复购：学生在菜品详情页就口味、食材、辣度向商家留言，把常吃的菜加入收藏方便下次再点，'
    '并在“我下单的”中跟踪“待接单→已接单→已完成”的进度；\n'
    '（4）平台治理：管理员登录后台查看用户、菜品、订单的统计数据，处理违规账号与问题菜品。')

# ---- 2.1 总体架构 ----
must_replace(53,
    '项目采用典型的前后端分离三层架构。前端表现层为 Vue 3 单页应用（SPA），由 Vite 构建，'
    'Vue Router 负责路由与登录/管理员权限守卫，Pinia 维护登录状态，Axios 统一发起 HTTP 请求并自动携带 JWT；'
    '后端服务层基于 Node.js + Express 提供 RESTful 接口（统一前缀 /api），负责身份鉴权、参数校验、'
    '点餐业务规则与订单状态流转，并使用 Multer 处理菜品图片上传；数据层为 SQLite 关系数据库，'
    '包含 users、products、favorites、comments、orders 五张表，通过外键关联。'
    '开发阶段前端运行在 5173 端口，由 Vite 的 proxy 把 /api 与 /uploads 请求代理到后端 3000 端口，避免跨域问题；'
    '生产阶段前端执行 npm run build 生成 dist，由 Express 直接托管静态资源并对前端路由做 history 回退，'
    '只需启动一个 Node 进程、开放一个端口即可提供完整服务。项目目录结构如下：')
anchor = insert_after(P[53], 'yuexiang-canteen/                    // 项目根目录', code=True)
tree = [
    '├─ backend/                           # 后端服务（Express）',
    '│   ├─ src/',
    '│   │   ├─ server.js                  # 服务入口，注册路由、静态资源与 SPA 托管',
    '│   │   ├─ config.js                  # 端口、JWT 密钥、菜品分类/风味枚举',
    '│   │   ├─ db.js                      # SQLite 连接、建表与演示数据初始化',
    '│   │   ├─ seed-images.js             # 自动生成演示菜品 SVG 图片',
    '│   │   ├─ middleware/auth.js         # JWT 鉴权与管理员权限中间件',
    '│   │   └─ routes/                    # auth/products/orders/favorites/...',
    '│   ├─ uploads/                       # 菜品图片与头像（静态资源）',
    '│   └─ data/app.db                    # SQLite 数据库文件（首次运行自动生成）',
    '└─ frontend/                          # 前端工程（Vue 3 + Vite）',
    '    ├─ src/api/                       # Axios 实例与全部接口封装',
    '    ├─ src/stores/user.js             # Pinia 登录状态',
    '    ├─ src/router/index.js            # 路由与权限守卫',
    '    ├─ src/layouts/MainLayout.vue     # 导航栏 + 页脚布局',
    '    ├─ src/components/ProductCard.vue # 菜品卡片组件',
    '    └─ src/views/                     # 首页/详情/上架/订单/个人中心/后台等页面',
]
for line in tree:
    anchor = insert_after(anchor, line, code=True)
anchor = insert_after(anchor,
    '后端主要接口包括：POST /api/auth/register、POST /api/auth/login（认证）；'
    'GET/POST/PUT/DELETE /api/products（菜品 CRUD）；POST /api/favorites/toggle（收藏）；'
    'POST /api/orders、PATCH /api/orders/:id（下单与接单状态流转）；GET/POST /api/comments（菜品留言）；'
    'GET /api/admin/*（管理后台）；POST /api/upload（图片上传），接口风格符合 RESTful 规范。')

# ---- 2.3 核心功能实现 ----
must_replace(57,
    '核心功能一：基于 JWT 的无状态登录鉴权。用户登录成功后，后端用 jsonwebtoken 签发包含用户 id、'
    '用户名与角色的 Token（有效期 7 天），前端存入 localStorage，并由 Axios 请求拦截器在每次请求头中添加'
    '“Authorization: Bearer <token>”。后端 authRequired 中间件统一校验 Token、查询用户状态（封禁用户拒绝访问），'
    '管理员接口再叠加 adminRequired 角色判断，实现了接口级别的权限控制。'
    '关键代码位于 backend/src/middleware/auth.js：')
anchor = insert_after(P[57], 'export function authRequired(req, res, next) {', code=True)
for line in [
    '  const token = (req.headers.authorization || "").slice(7);',
    '  if (!token) return res.status(401).json({ message: "请先登录" });',
    '  const payload = jwt.verify(token, JWT_SECRET);',
    '  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id);',
    '  if (user.status === "banned") return res.status(403).json({ message: "账号已封禁" });',
    '  req.user = user;          // 后续路由直接使用登录用户信息',
    '  next();',
    '}',
]:
    anchor = insert_after(anchor, line, code=True)
anchor = insert_after(anchor,
    '前端请求拦截器（frontend/src/api/request.js）会为所有请求自动注入请求头：'
    'config.headers.Authorization = `Bearer ${token}`；响应拦截器统一处理 401（过期即清空登录态并跳转登录页）'
    '与后端返回的错误提示。运行效果：未登录访问“我的菜品”会被路由守卫拦截到登录页；'
    '普通用户直接访问 /admin 接口会返回 403。')
anchor = insert_after(anchor,
    '核心功能二：点餐订单状态机。订单设计了 pending（待商家接单）、agreed（商家已接单）、'
    'rejected（已拒单）、completed（已完成）、canceled（已取消）五种状态，并对顾客与商家分别约束可执行的动作：'
    '下单顾客可以取消订单、在商家接单后确认取餐；商家可以对新订单接单或拒单。当顾客确认取餐完成时，'
    '后端在同一业务流程中把对应菜品自动标记为“已售罄”，保证数据一致性。关键代码位于 '
    'backend/src/routes/orders.js：')
for line in [
    '} else if (action === "complete") {',
    '  if (!isBuyer) return res.status(403).json({ message: "只有下单顾客可以确认取餐" });',
    '  if (order.status !== "agreed") return res.status(400)',
    '  nextStatus = "completed";',
    '}',
    'db.prepare("UPDATE orders SET status=?, updated_at=? WHERE id=?").run(...);',
    'if (nextStatus === "completed")',
    '  db.prepare("UPDATE products SET status=\'sold\' WHERE id=?").run(order.product_id);',
]:
    anchor = insert_after(anchor, line, code=True)
anchor = insert_after(anchor,
    '前端 src/views/Orders.vue 用 el-tabs 区分“我下单的 / 门店接单”，根据当前状态条件渲染操作按钮，'
    '完整演示了“下单 → 商家接单 → 顾客确认取餐 → 菜品自动售罄”的点餐链路。')

must_replace(59,
    '本地运行（课堂演示方式）：安装 Node.js v22.5 及以上版本（开发使用 v24，内置 SQLite 驱动，无需安装数据库），'
    '分别在 backend、frontend 目录执行 npm install 安装依赖；开发模式下先 npm start 启动后端（3000 端口）、'
    '再 npm run dev 启动前端（5173 端口，自动代理接口）。生产方式只需在 frontend 下执行 npm run build，'
    '随后启动后端，Express 会自动托管 frontend/dist，浏览器访问 http://localhost:3000 即可使用完整网站。\n'
    '公网部署计划：后端部署到 Render 免费 Web Service（Build Command：npm install；Start Command：'
    'node src/server.js，并配置 JWT_SECRET 环境变量）；前端构建产物可由后端直接托管，或单独部署到 Vercel，'
    '两个平台均支持 Git 推送后自动持续部署。演示前将把实际访问地址填入 5.1 节。')

must_replace(63,
    '（1）Trae 内置 AI 助手：用于项目技术选型讨论、前后端代码生成与重构、报错信息分析、'
    '正则/SQL 语句核对，以及本报告文字的润色，是全程使用的主要工具。\n'
    '（2）DeepSeek 网页版：用于对 AI 生成的关键代码进行二次验证（如 node:sqlite 的最新用法、'
    'JWT 过期处理逻辑），并讨论点餐订单状态机等业务设计。\n'
    '（3）官方文档：Express、Element Plus、MDN 与 Vite 官方文档，用于核实 AI 输出的准确性。')

must_replace(67,
    'AI 在本项目中帮助最大的环节有三个：一是项目初期的技术选型与架构梳理，AI 快速给出了前后端分离的'
    '可行方案与目录结构，让我们少走弯路；二是样板代码生成，例如 Express 路由骨架、Element Plus 表格与'
    '上传组件的用法，显著缩短了编码时间；三是报错排查，把终端报错贴给 AI 后通常能快速定位原因。\n'
    '但 AI 的回答并非总是可靠：例如它一度给出 node:sqlite 需要 --experimental-sqlite 启动参数的旧说法，'
    '我们查阅官方文档后确认 Node 24 已可直接使用；再如订单状态流转的权限规则，AI 最初只考虑了正常流程，'
    '“重复下单拦截”“顾客与商家越权操作”等边界情况是我们自己讨论后补充的。小组的核对方式是：所有 AI 生成的代码'
    '必须人工读一遍再合并，关键逻辑编写自动化接口测试（共 23 项断言全部通过）验证，并以实际页面联调结果为准。'
    '我们的体会是：AI 是高效的“副驾驶”，但业务正确性与安全性必须由自己负责。')

must_replace(81,
    '课堂演示由两位组员配合完成：组员一负责操作浏览器，以学生身份依次演示注册登录、菜品搜索与分类筛选、'
    '收藏、菜品留言、下单（填写忌口与取餐时间）、在“我下单的”中查看进度；组员二负责讲解核心代码与架构，'
    '重点切换到商家账号（chuancook）演示“门店接单”的接单/拒单与菜品上下架，再使用 admin/admin123 登录'
    '管理后台展示数据统计、用户封禁与菜品管理，并准备回答老师关于 JWT 鉴权、数据库表关系、部署方式的提问。'
    '演示前会重置数据库为初始演示数据，预置管理员、学生与四类商家共 7 个账号、12 道覆盖六个分类的菜品，'
    '以及若干菜品留言与点餐订单，确保现场即开即演。')

must_replace(83,
    '通过这次大作业，我们完整经历了一个前后端分离 Web 项目从需求分析、技术选型、编码实现、接口联调到'
    '打包部署的全过程，对课堂知识有了系统性的理解。技术上，前端方面我们掌握了 Vue 3 组合式 API 的写法、'
    'Vue Router 的路由守卫、Pinia 的状态管理，以及 Element Plus 表格、表单、上传、对话框等组件的实战用法；'
    '后端方面，我们实践了 Express 路由分层、RESTful 接口设计、JWT 无状态鉴权、密码 bcrypt 加密、'
    'Multer 文件上传和事务性的业务更新（确认取餐同时菜品售罄）；数据库方面，从画 ER 关系开始，'
    '设计了用户、菜品、收藏、留言、订单五张表，理解了外键与索引在真实业务中的作用。\n'
    '团队协作方面，两位组员按照“前端 / 后端+数据库”的主线分工，又共同参与联调，遇到接口字段不一致、'
    '跨域、图片路径等问题时，通过先约定 JSON 数据结构再各自开发的方式减少了摩擦，也体会到接口文档和'
    '统一返回格式的重要性。AI 工具的使用让我们效率提升明显，但也让我们认识到：AI 擅长生成“看起来正确”的代码，'
    '业务边界与安全问题必须靠自己思考和测试覆盖，这是本次实践最深刻的体会。\n'
    '项目仍有不足：目前是线上点单、线下取餐的模式，在线支付与出餐叫号尚未实现；图片只保存在服务器本地，'
    '云部署后可迁移到对象存储；前端也可以再做移动端适配。未来若继续完善，我们计划接入校园邮箱认证、'
    'WebSocket 订单实时提醒、购物车合并下单和 Docker 一键部署。总体而言，本项目达到了立项时的预期目标，'
    '我们不仅完成了一个可演示的网站，也建立了独立开发全栈应用的信心。')


# ---------------- 表格填写 ----------------
T = doc.tables

# 表0：小组信息
set_cell(T[0].rows[2].cells[1], '第 ______ 组（请填写小组编号）')
set_cell(T[0].rows[3].cells[1], '悦享食堂——校园美食点餐平台')
set_cell(T[0].rows[4].cells[1], '（组长）请填写：姓名　学号')
set_cell(T[0].rows[5].cells[1], '（组员）请填写：姓名　学号')
set_cell(T[0].rows[6].cells[1], '2026 年 10 月 14 日')

# 表1：功能清单
funcs = [
    ('1', '用户注册登录', '用户名注册（格式校验、密码 bcrypt 加密）、JWT 登录与退出、修改资料与密码、管理员封禁账号', '已完成'),
    ('2', '菜品浏览搜索', '首页卡片展示、六大分类筛选、关键字搜索、最新/价格/热度排序、分页', '已完成'),
    ('3', '菜品上架与管理', '最多 3 张实拍图上传、表单校验、编辑、上架/下架/标记售罄、删除', '已完成'),
    ('4', '菜品详情', '图片轮播、售价/门市价/风味/浏览量、商家卡片与商家主页', '已完成'),
    ('5', '菜品留言咨询', '登录后留言询问口味与忌口、按时间展示、本人与管理员可删除', '已完成'),
    ('6', '收藏功能', '一键收藏/取消、我的收藏列表、菜品收藏数实时更新', '已完成'),
    ('7', '点餐订单', '下单去重校验、商家接单/拒单、顾客取消/确认取餐，状态自动流转，完成后菜品自动标记售罄', '已完成'),
    ('8', '管理后台', '数据统计卡片与图表、用户搜索/封禁/删除、全站菜品搜索/改状态/删除', '已完成'),
]
for i, vals in enumerate(funcs):
    if i < 3:
        for cell, v in zip(T[1].rows[i + 1].cells, vals):
            set_cell(cell, v)
    else:
        add_table_row(T[1], vals)

# 表2：技术栈
techs = [
    ('前端', 'Vue 3 + Vite + Vue Router + Pinia + Element Plus + Axios', '组件化开发、生态成熟且为课程所学；Vite 热更新快，Pinia 管理登录态方便'),
    ('后端', 'Node.js + Express + jsonwebtoken + bcryptjs + Multer', '与前端同为 JavaScript 降低协作成本；RESTful 路由清晰；JWT 无状态鉴权、Multer 处理图片上传'),
    ('数据库', 'SQLite（Node 内置 node:sqlite 驱动）', '零安装、单文件便于开发演示与备份；关系型表结构清晰，SQL 标准，后续可平滑迁移到 MySQL'),
    ('部署', 'Express 单端口托管前端 dist（本地/云服务器）；可部署 Render / Vercel', '一条 npm 命令即可运行；免费平台支持 Git 推送后自动持续部署'),
    ('AI 工具', 'Trae 内置 AI 助手、DeepSeek', '辅助方案设计、代码生成、报错排查与报告撰写，人工核对后采纳'),
]
for i, vals in enumerate(techs):
    for cell, v in zip(T[2].rows[i + 1].cells, vals):
        set_cell(cell, v)

# 表3：数据库设计
tables = [
    ('users', 'id / username / password / nickname / avatar / phone / bio / role / status / created_at',
     'INTEGER 主键自增 / TEXT 唯一 / TEXT(哈希) / TEXT / TEXT / TEXT / TEXT / TEXT / TEXT / TEXT',
     '学生、商家与管理员账号，role 区分管理员，status 记录封禁状态'),
    ('products', 'id / seller_id / title / description / price / original_price / category / item_condition / images / status / view_count / favorite_count / created_at',
     'INTEGER 主键 / INTEGER 外键 / TEXT / TEXT / REAL / REAL / TEXT / TEXT / TEXT(JSON) / TEXT / INTEGER / INTEGER / TEXT',
     '菜品信息，images 以 JSON 数组存多张图片，status 为 on 供应中/off 已下架/sold 已售罄，item_condition 存风味标签'),
    ('favorites', 'id / user_id / product_id / created_at',
     'INTEGER 主键 / INTEGER 外键 / INTEGER 外键 / TEXT',
     '收藏关系表，(user_id, product_id) 联合唯一，防止重复收藏'),
    ('comments', 'id / product_id / user_id / content / created_at',
     'INTEGER 主键 / INTEGER 外键 / INTEGER 外键 / TEXT / TEXT',
     '菜品留言咨询，随菜品删除而级联删除'),
    ('orders', 'id / order_no / product_id / buyer_id / seller_id / price / remark / status / created_at / updated_at',
     'INTEGER 主键 / TEXT 唯一 / INTEGER 外键 ×3 / REAL / TEXT / TEXT / TEXT / TEXT',
     '点餐订单，status 维护五种订单状态，remark 存忌口与取餐要求，冗余成交价保证历史价格准确'),
]
for i, vals in enumerate(tables):
    if i < 2:
        for cell, v in zip(T[3].rows[i + 1].cells, vals):
            set_cell(cell, v, size=9)
    else:
        add_table_row(T[3], vals)
        for cell in T[3].rows[-1].cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9)

# 表4：AI 典型对话
dialogs = [
    ('1', '我们要做校园美食点餐平台，前后端分离，两人两周内完成，技术栈怎么选？',
     '推荐 Vue 3 + Vite + Element Plus 做前端，Node.js + Express 做后端提供 RESTful API；数据库开发期用 SQLite 免安装，再配 JWT 登录鉴权和 Multer 上传。',
     '直接采纳：与课程内容契合且学习成本低；我们补充了 Pinia 状态管理与 bcrypt 密码加密。'),
    ('2', 'Node.js 24 上不想安装 MySQL，能用内置 SQLite 吗？DatabaseSync 的写法是怎样的？',
     '给出 import { DatabaseSync } from "node:sqlite" 的 prepare/run/get/all 示例；但提示可能需要 --experimental-sqlite 启动参数。',
     '部分采纳：API 示例正确可用；启动参数说法已过时，我们查阅官方文档确认 Node 24 无需该参数，并据此封装 db.js。'),
    ('3', '点餐的订单状态怎么设计才严谨？顾客和商家分别能操作哪些状态？',
     '建议设计 pending→agreed/rejected→completed/canceled 状态机，并区分顾客与商家权限；完成后通知双方。',
     '部分采纳：状态与权限矩阵采纳；我们额外增加了“进行中订单重复下单拦截（409）”“确认取餐时自动将菜品标记为已售罄”两条业务规则。'),
    ('4', 'Vite 开发时跨域怎么解决？上线后又不想前端后端各开一个端口。',
     '开发用 Vite 的 server.proxy 把 /api 代理到 3000 端口；生产用 express.static 托管 dist，并对非 API 路径回退 index.html 支持前端路由。',
     '直接采纳：实现了开发热更新代理与生产单端口部署，课堂演示只需启动一个服务。'),
]
for i, vals in enumerate(dialogs):
    if i < 3:
        for cell, v in zip(T[4].rows[i + 1].cells, vals):
            set_cell(cell, v, size=9)
    else:
        add_table_row(T[4], vals)
        for cell in T[4].rows[-1].cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9)

# 表5：成员分工
remove_row(T[5], 3)
set_cell(T[5].rows[1].cells[0], '组员一（组长）')
set_cell(T[5].rows[1].cells[1], '（请填写学号）')
set_cell(T[5].rows[1].cells[2],
    '前端架构搭建；首页、菜品详情、上架、点餐订单、个人中心等全部页面与菜品卡片组件开发；'
    'Axios 封装与前后端联调；生产构建、部署上线与课堂学生侧功能演示')
set_cell(T[5].rows[2].cells[0], '组员二')
set_cell(T[5].rows[2].cells[1], '（请填写学号）')
set_cell(T[5].rows[2].cells[2],
    'Express 后端服务与全部 RESTful 接口开发；数据库五张表的设计与商家/菜品演示数据初始化；'
    'JWT 鉴权、订单状态机、图片上传；23 项接口自动化测试；本报告主要撰写')

# 表6：贡献度
remove_row(T[6], 3)
set_cell(T[6].rows[1].cells[0], '组员一（组长）')
set_cell(T[6].rows[1].cells[1], '55%')
set_cell(T[6].rows[1].cells[2], '承担全部前端开发与联调、部署演示，工作量略多，故贡献度为 55%')
set_cell(T[6].rows[2].cells[0], '组员二')
set_cell(T[6].rows[2].cells[1], '45%')
set_cell(T[6].rows[2].cells[2], '承担全部后端接口、数据库设计与测试，并撰写报告，贡献度为 45%')

# 表7：上线信息
set_cell(T[7].rows[1].cells[1],
    '本地演示：http://localhost:3000（npm start 即启动完整网站）\n公网地址：部署 Render/Vercel 后补充填写')
set_cell(T[7].rows[2].cells[1],
    '管理员：admin / admin123\n学生顾客：alice / 123456（bob 同为学生）\n商家：chuancook / yuecook / qingfood / naicha，密码均为 123456')
set_cell(T[7].rows[3].cells[1], '（请填写 GitHub / Gitee 仓库链接）')
set_cell(T[7].rows[4].cells[1],
    'Node.js v24（要求 ≥ v22.5，内置 SQLite）、无需安装数据库；\n开发环境 Windows 10/11，浏览器 Chrome/Edge；\n依赖安装：npm install，启动：node backend/src/server.js')

# 表8：演示视频
set_cell(T[8].rows[1].cells[1], '（录制完成后填写网盘 / 视频平台链接及提取码）')
set_cell(T[8].rows[2].cells[1], '网站功能演示（注册登录、菜品上架、搜索、收藏、下单、商家接单、后台管理）、开发过程介绍、本地部署步骤')
set_cell(T[8].rows[3].cells[1], '约 6 分钟（在建议的 5–10 分钟范围内）')

# 表9：提交清单
set_cell(T[9].rows[1].cells[3], '已完成')
set_cell(T[9].rows[2].cells[3], '待录制（课堂演示前完成）')
set_cell(T[9].rows[3].cells[3], '本地已上线可访问，公网部署按计划进行')
set_cell(T[9].rows[4].cells[3], '已准备（双人分工演示、预置测试数据与账号）')

doc.save(DST)
print('报告已生成:', DST)
