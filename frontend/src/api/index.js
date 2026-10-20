// 全站接口封装（与后端 RESTful API 一一对应）
import request from './request';

// ---- 基础数据 ----
export const getMeta = () => request.get('/meta');

// ---- 认证 ----
export const login = (data) => request.post('/auth/login', data);
export const register = (data) => request.post('/auth/register', data);
export const getMe = () => request.get('/auth/me');

// ---- 用户 ----
export const getUserProfile = (id) => request.get(`/users/${id}`);
export const updateProfile = (data) => request.put('/users/profile', data);
export const changePassword = (data) => request.put('/users/password', data);

// ---- 菜品 ----
export const getProducts = (params) => request.get('/products', { params });
export const getProduct = (id) => request.get(`/products/${id}`);
export const getMyProducts = () => request.get('/products/mine');
export const createProduct = (data) => request.post('/products', data);
export const updateProduct = (id, data) => request.put(`/products/${id}`, data);
export const updateProductStatus = (id, status) => request.patch(`/products/${id}/status`, { status });
export const deleteProduct = (id) => request.delete(`/products/${id}`);

// ---- 收藏 ----
export const getFavorites = () => request.get('/favorites');
export const toggleFavorite = (productId) => request.post('/favorites/toggle', { productId });

// ---- 留言 ----
export const getComments = (productId) => request.get('/comments', { params: { productId } });
export const addComment = (data) => request.post('/comments', data);
export const deleteComment = (id) => request.delete(`/comments/${id}`);

// ---- 订单 ----
export const createOrder = (data) => request.post('/orders', data);
export const getOrders = (params) => request.get('/orders', { params });
export const orderAction = (id, action) => request.patch(`/orders/${id}`, { action });

// ---- 管理后台 ----
export const adminGetStats = () => request.get('/admin/stats');
export const adminGetUsers = (params) => request.get('/admin/users', { params });
export const adminSetUserStatus = (id, status) => request.patch(`/admin/users/${id}/status`, { status });
export const adminDeleteUser = (id) => request.delete(`/admin/users/${id}`);
export const adminGetProducts = (params) => request.get('/admin/products', { params });
export const adminSetProductStatus = (id, status) => request.patch(`/admin/products/${id}/status`, { status });
export const adminDeleteProduct = (id) => request.delete(`/admin/products/${id}`);
export const adminGetOrders = (params) => request.get('/admin/orders', { params });
export const adminDeleteOrder = (id) => request.delete(`/admin/orders/${id}`);

// ---- 图片上传 ----
export const uploadImage = (file) => {
  const form = new FormData();
  form.append('file', file);
  return request.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
