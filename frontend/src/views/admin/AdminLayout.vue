<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <router-link to="/" class="admin-logo">
        <span>🍜</span> 悦享食堂
      </router-link>
      <p class="sidebar-sub">管理后台</p>
      <el-menu :default-active="$route.path" router class="menu">
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataLine /></el-icon><span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon><span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Goods /></el-icon><span>菜品管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><List /></el-icon><span>交易订单</span>
        </el-menu-item>
      </el-menu>
      <router-link to="/" class="back-link">← 返回网站首页</router-link>
    </aside>
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { DataLine, User, Goods, List } from '@element-plus/icons-vue';
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; }
.sidebar {
  width: 230px;
  background: #3d2b1f;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.admin-logo {
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  padding: 26px 24px 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sidebar-sub { color: #c9a98f; font-size: 12px; padding: 0 24px 20px; margin: 0; }
.menu {
  flex: 1;
  background: transparent;
  border-right: none;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #c7cbe8;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.08);
  --el-menu-active-color: #fff;
}
.menu .el-menu-item.is-active { background: rgba(255, 122, 47, 0.55); }
.back-link { display: block; padding: 18px 24px; color: #c9a98f; font-size: 13px; }
.back-link:hover { color: #fff; }
.admin-main { flex: 1; padding: 28px; background: #fdf8f4; overflow: auto; }
</style>
