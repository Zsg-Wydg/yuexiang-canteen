// axios 实例：统一注入 token、统一错误提示
import axios from 'axios';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'shiguang_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 请求拦截：自动携带 JWT
request.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截：直接返回 data，401 跳登录
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '网络异常，请稍后重试';
    if (status === 401) {
      clearToken();
      if (!location.pathname.startsWith('/login')) {
        ElMessage.warning('登录已过期，请重新登录');
        location.href = '/login';
      }
    } else {
      ElMessage.error(message);
    }
    return Promise.reject(error);
  }
);

export default request;
