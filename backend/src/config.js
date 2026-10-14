// 全局配置：端口、JWT 密钥等均可通过环境变量覆盖（部署时使用）
export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'yuexiang-canteen-jwt-secret-2026';
export const JWT_EXPIRES_IN = '7d';

// 菜品分类
export const CATEGORIES = ['招牌热菜', '粉面粥饭', '轻食沙拉', '奶茶饮品', '甜点小吃', '新鲜水果'];

// 风味标签
export const CONDITIONS = ['咸香家常', '香辣开胃', '清淡健康', '香甜可口'];
