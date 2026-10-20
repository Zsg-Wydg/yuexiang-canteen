import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from '@/api/request';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/views/Home.vue') },
      { path: 'product/:id', name: 'product', component: () => import('@/views/ProductDetail.vue') },
      { path: 'user/:id', name: 'userHome', component: () => import('@/views/UserHome.vue') },
      { path: 'publish', name: 'publish', component: () => import('@/views/Publish.vue'), meta: { auth: true } },
      { path: 'my-products', name: 'myProducts', component: () => import('@/views/MyProducts.vue'), meta: { auth: true } },
      { path: 'favorites', name: 'favorites', component: () => import('@/views/Favorites.vue'), meta: { auth: true } },
      { path: 'orders', name: 'orders', component: () => import('@/views/Orders.vue'), meta: { auth: true } },
      { path: 'profile', name: 'profile', component: () => import('@/views/Profile.vue'), meta: { auth: true } }
    ]
  },
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue') },
  { path: '/register', name: 'register', component: () => import('@/views/Register.vue') },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { auth: true, admin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'adminDashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'users', name: 'adminUsers', component: () => import('@/views/admin/Users.vue') },
      { path: 'products', name: 'adminProducts', component: () => import('@/views/admin/Products.vue') },
      { path: 'orders', name: 'adminOrders', component: () => import('@/views/admin/Orders.vue') }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
});

// 登录与管理员权限守卫
router.beforeEach((to) => {
  if (to.meta.auth && !getToken()) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  // admin 角色在应用启动后由 store 中的 user 信息判断
  if (to.meta.admin) {
    const raw = localStorage.getItem('shiguang_user_role');
    if (raw !== 'admin') return { name: 'home' };
  }
  return true;
});

export default router;
