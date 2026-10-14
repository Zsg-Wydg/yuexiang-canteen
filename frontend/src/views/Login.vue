<template>
  <div class="auth-page">
    <div class="auth-card">
      <router-link to="/" class="brand">
        <span class="brand-icon">🍜</span>
        <span class="brand-name">悦享食堂</span>
      </router-link>
      <h2>欢迎回来 👋</h2>
      <p class="sub">登录后收藏美食、在线点餐、查看订单进度</p>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent>
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="密码"
                    :prefix-icon="Lock" @keyup.enter="onSubmit" />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="loading" @click="onSubmit">登 录</el-button>
      </el-form>

      <div class="switch-line">
        还没有账号？<router-link to="/register" class="link">立即注册</router-link>
      </div>

      <el-divider>演示账号（点击快速填充）</el-divider>
      <div class="demo-accounts">
        <el-tag class="demo-tag" @click="fill('admin', 'admin123')">管理员 admin / admin123</el-tag>
        <el-tag type="success" class="demo-tag" @click="fill('alice', '123456')">顾客 alice / 123456</el-tag>
        <el-tag type="warning" class="demo-tag" @click="fill('chuancook', '123456')">商家 chuancook / 123456</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const formRef = ref();
const loading = ref(false);
const form = reactive({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

function fill(u, p) {
  form.username = u;
  form.password = p;
}

async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    const user = await userStore.login(form);
    localStorage.setItem('shiguang_user_role', user.role);
    ElMessage.success(`欢迎回来，${user.nickname}！`);
    const redirect = route.query.redirect || (user.role === 'admin' ? '/admin/dashboard' : '/');
    router.push(redirect);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff9d5c 0%, #e8590c 100%);
  padding: 20px;
}
.auth-card {
  width: 420px;
  background: #fff;
  border-radius: 18px;
  padding: 36px 38px 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
}
.brand { display: flex; align-items: center; gap: 8px; justify-content: center; }
.brand-icon { font-size: 26px; }
.brand-name { font-size: 22px; font-weight: 800; color: var(--brand); }
.auth-card h2 { text-align: center; margin: 18px 0 6px; }
.sub { text-align: center; color: #9ca3af; font-size: 13px; margin: 0 0 26px; }
.submit-btn { width: 100%; margin-top: 6px; }
.switch-line { text-align: center; margin-top: 16px; font-size: 14px; color: #6b7280; }
.link { color: var(--brand); font-weight: 600; }
.demo-accounts { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.demo-tag { cursor: pointer; }
</style>
