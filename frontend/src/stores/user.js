// 用户登录状态（Pinia + localStorage 持久化 token）
import { defineStore } from 'pinia';
import { getMe, login as apiLogin, register as apiRegister } from '@/api';
import { getToken, setToken, clearToken } from '@/api/request';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    user: null
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === 'admin'
  },
  actions: {
    async login(form) {
      const { token, user } = await apiLogin(form);
      this.token = token;
      this.user = user;
      setToken(token);
      return user;
    },
    async register(form) {
      const { token, user } = await apiRegister(form);
      this.token = token;
      this.user = user;
      setToken(token);
      return user;
    },
    async fetchMe() {
      if (!this.token) return null;
      try {
        this.user = await getMe();
        return this.user;
      } catch {
        this.logout();
        return null;
      }
    },
    setUser(user) {
      this.user = user;
    },
    logout() {
      this.token = null;
      this.user = null;
      clearToken();
    }
  }
});
