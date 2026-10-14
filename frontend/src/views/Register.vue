<template>
  <div class="auth-page">
    <div class="auth-card">
      <router-link to="/" class="brand">
        <span class="brand-icon">🍜</span>
        <span class="brand-name">悦享食堂</span>
      </router-link>
      <h2>创建账号 ✨</h2>
      <p class="sub">注册后即可在线点餐，也可以上架自家美食</p>

      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名（3-20 位字母/数字/下划线）" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="nickname">
          <el-input v-model="form.nickname" placeholder="昵称（选填，默认与用户名相同）" :prefix-icon="Avatar" />
        </el-form-item>
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号（选填，方便接收取餐通知）" :prefix-icon="Phone" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="设置密码（至少 6 位）" :prefix-icon="Lock" />
        </el-form-item>
        <el-form-item prop="confirm">
          <el-input v-model="form.confirm" type="password" show-password placeholder="确认密码" :prefix-icon="Lock" @keyup.enter="onSubmit" />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="loading" @click="onSubmit">注 册</el-button>
      </el-form>

      <div class="switch-line">
        已有账号？<router-link to="/login" class="link">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock, Avatar, Phone } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref();
const loading = ref(false);
const form = reactive({ username: '', nickname: '', phone: '', password: '', confirm: '' });

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '3-20 位字母、数字或下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: (r, v, cb) => v === form.password ? cb() : cb(new Error('两次输入的密码不一致')), trigger: 'blur' }
  ]
};

async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    const user = await userStore.register({
      username: form.username,
      password: form.password,
      nickname: form.nickname || form.username,
      phone: form.phone || ''
    });
    localStorage.setItem('shiguang_user_role', user.role);
    ElMessage.success('注册成功，欢迎加入悦享食堂！');
    router.push('/');
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
</style>
