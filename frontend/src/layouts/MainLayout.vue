<template>
  <div class="layout">
    <header class="header">
      <div class="container header-inner">
        <router-link to="/" class="logo">
          <span class="logo-icon">🍜</span>
          <span class="logo-text">悦享食堂</span>
          <span class="logo-sub">校园美食点餐平台</span>
        </router-link>

        <div class="search-box">
          <el-input
            v-model="keyword"
            placeholder="搜索想吃的美食…"
            clearable
            size="large"
            @keyup.enter="doSearch"
            @clear="doSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="doSearch" />
            </template>
          </el-input>
        </div>

        <div class="header-actions">
          <template v-if="userStore.isLoggedIn">
            <el-button type="primary" size="large" :icon="Plus" @click="$router.push('/publish')">上架菜品</el-button>
            <el-badge :is-dot="false" :value="''" :hidden="true">
              <el-button circle size="large" @click="$router.push('/favorites')">
                <el-icon><Star /></el-icon>
              </el-button>
            </el-badge>
            <el-dropdown trigger="click" @command="onCommand">
              <span class="user-trigger">
                <el-avatar :size="36" :src="userStore.user?.avatar" />
                <span class="user-name">{{ userStore.user?.nickname }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile" :icon="User">个人中心</el-dropdown-item>
                  <el-dropdown-item command="myProducts" :icon="Goods">我的菜品</el-dropdown-item>
                  <el-dropdown-item command="favorites" :icon="Star">我的收藏</el-dropdown-item>
                  <el-dropdown-item command="orders" :icon="List">点餐订单</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" command="admin" :icon="Setting" divided>管理后台</el-dropdown-item>
                  <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button size="large" @click="$router.push('/login')">登录</el-button>
            <el-button size="large" type="primary" plain @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <div class="container">
        <p>悦享食堂 · 校园美味，一键即达</p>
        <p class="footer-sub">《Web 开发技术》课程大作业 · Vue 3 + Node.js + Express + SQLite 前后端分离实践</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { Search, Plus, User, Goods, Star, List, Setting, SwitchButton, ArrowDown } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const keyword = ref(route.query.keyword || '');

function doSearch() {
  router.push({ name: 'home', query: keyword.value ? { keyword: keyword.value } : {} });
}

async function onCommand(command) {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' });
    userStore.logout();
    localStorage.removeItem('shiguang_user_role');
    router.push('/');
  } else if (command === 'admin') {
    router.push('/admin/dashboard');
  } else {
    router.push('/' + command.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()));
  }
}
</script>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100%; }

.header {
  background: #fff;
  box-shadow: 0 2px 10px rgba(31, 41, 55, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  height: 70px;
  display: flex;
  align-items: center;
  gap: 26px;
}
.logo { display: flex; align-items: baseline; gap: 8px; flex-shrink: 0; }
.logo-icon { font-size: 28px; align-self: center; }
.logo-text {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(90deg, #ff8a3d, #e8590c);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.logo-sub { font-size: 12px; color: #9ca3af; }

.search-box { flex: 1; max-width: 520px; }

.header-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.user-trigger { display: flex; align-items: center; gap: 8px; cursor: pointer; outline: none; }
.user-name { font-size: 14px; color: #374151; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.main { flex: 1; padding: 24px 0 40px; }

.footer {
  background: #3d2b1f;
  color: #c9b8a8;
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
}
.footer p { margin: 4px 0; }
.footer-sub { font-size: 12px; color: #8a7565; }
</style>
