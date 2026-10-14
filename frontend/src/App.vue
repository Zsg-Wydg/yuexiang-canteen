<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

onMounted(async () => {
  const user = await userStore.fetchMe();
  // 供路由守卫同步读取角色
  if (user) localStorage.setItem('shiguang_user_role', user.role);
  else localStorage.removeItem('shiguang_user_role');
});
</script>
