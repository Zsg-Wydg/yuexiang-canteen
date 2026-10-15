<template>
  <div class="container" v-loading="loading">
    <template v-if="product">
      <el-breadcrumb :separator-icon="ArrowRight" class="crumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/', query: { category: product.category } }">{{ product.category }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ product.title }}</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="detail-wrap">
        <!-- 左：图片 -->
        <div class="gallery page-card">
          <el-carousel height="380px" :autoplay="false" indicator-position="outside">
            <el-carousel-item v-for="(img, i) in product.images" :key="i">
              <el-image :src="img" fit="contain" class="gallery-img" />
            </el-carousel-item>
          </el-carousel>
        </div>

        <!-- 右：信息 -->
        <div class="detail-main">
          <div class="page-card main-card">
            <h1 class="title">{{ product.title }}</h1>
            <div class="tags">
              <el-tag type="primary" effect="light">{{ product.category }}</el-tag>
              <el-tag type="warning" effect="light">{{ product.item_condition }}</el-tag>
              <el-tag v-if="product.status === 'sold'" type="info">已售罄</el-tag>
              <el-tag v-else-if="product.status === 'off'" type="info">已下架</el-tag>
              <el-tag v-else type="success" effect="light">供应中</el-tag>
            </div>

            <div class="price-box">
              <div class="price-line">
                <span class="price-label">优惠价</span>
                <span class="price">¥{{ formatPrice(product.price) }}</span>
                <span v-if="product.original_price" class="origin">门市价 ¥{{ formatPrice(product.original_price) }}</span>
              </div>
              <div class="save" v-if="product.original_price">
                立省 ¥{{ formatPrice(product.original_price - product.price) }}
              </div>
            </div>

            <div class="stat-row">
              <span><el-icon><View /></el-icon> 浏览 {{ product.view_count }}</span>
              <span><el-icon><Star /></el-icon> 收藏 {{ product.favorite_count }}</span>
              <span><el-icon><ChatDotRound /></el-icon> 留言 {{ comments.length }}</span>
              <span>上架于 {{ formatDate(product.created_at) }}</span>
            </div>

            <!-- 商家卡片 -->
            <div class="seller-card" @click="$router.push(`/user/${product.seller.id}`)">
              <el-avatar :size="46" :src="product.seller.avatar" />
              <div class="seller-info">
                <div class="seller-name">{{ product.seller.nickname }}<span class="shop-tag">商家</span></div>
                <div class="seller-bio text-ellipsis-1">{{ product.seller.bio }}</div>
              </div>
              <el-icon class="arrow"><ArrowRight /></el-icon>
            </div>

            <!-- 操作按钮 -->
            <div class="actions">
              <template v-if="!isOwner">
                <el-button
                  size="large" round :type="product.is_favored ? 'danger' : 'default'"
                  :icon="Star" :disabled="product.status !== 'on'" @click="onFav"
                >{{ product.is_favored ? '已收藏' : '收藏' }}</el-button>
                <el-button
                  v-if="product.status === 'on'"
                  type="primary" size="large" round class="buy-btn" @click="onBuy"
                >
                  <el-icon style="margin-right:6px"><ShoppingCart /></el-icon>立即下单
                </el-button>
                <el-tag v-if="product.status !== 'on'" type="info" size="large">该菜品已停止供应</el-tag>
              </template>
              <template v-else>
                <el-alert title="这是你家上架的菜品" type="info" :closable="false" show-icon style="margin-bottom:14px" />
                <el-button size="large" round @click="$router.push(`/publish?id=${product.id}`)">编辑菜品</el-button>
                <el-button size="large" round @click="$router.push('/my-products')">管理我的菜品</el-button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 介绍 + 留言 -->
      <div class="bottom-grid">
        <div class="page-card desc-card">
          <h3>菜品介绍</h3>
          <p class="desc-text">{{ product.description || '商家很懒，还没有填写菜品介绍~' }}</p>
        </div>

        <div class="page-card comment-card">
          <h3>菜品留言 <span class="comment-count">({{ comments.length }})</span></h3>
          <div class="comment-input">
            <el-avatar :size="36" :src="userStore.user?.avatar" />
            <el-input
              v-model="commentText" type="textarea" :rows="2" maxlength="200" show-word-limit
              :placeholder="userStore.isLoggedIn ? '有什么忌口或取餐要求？也可以向商家咨询食材与口味' : '登录后可以向商家咨询'"
            />
          </div>
          <div class="comment-submit">
            <el-button type="primary" round :disabled="!userStore.isLoggedIn" @click="submitComment">发表留言</el-button>
          </div>

          <el-divider />
          <div v-if="comments.length" class="comment-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <el-avatar :size="38" :src="c.avatar" />
              <div class="comment-body">
                <div class="comment-head">
                  <span class="comment-name">{{ c.nickname }}</span>
                  <span class="comment-time">{{ formatDate(c.created_at) }}</span>
                  <el-button
                    v-if="userStore.user?.id === c.user_id || userStore.isAdmin"
                    link type="danger" size="small" @click="removeComment(c.id)"
                  >删除</el-button>
                </div>
                <div class="comment-content">{{ c.content }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="还没有留言，有忌口或问题可以在这里咨询商家～" :image-size="80" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowRight, View, Star, ChatDotRound, ShoppingCart
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getProduct, getComments, addComment, deleteComment, toggleFavorite, createOrder } from '@/api';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const product = ref(null);
const comments = ref([]);
const commentText = ref('');

const isOwner = computed(() => userStore.user?.id === product.value?.seller?.id);

function formatPrice(v) {
  return Number(v).toFixed(Number(v) % 1 === 0 ? 0 : 2);
}
function formatDate(t) {
  return new Date(t).toLocaleDateString('zh-CN');
}

async function loadAll() {
  loading.value = true;
  try {
    product.value = await getProduct(route.params.id);
    comments.value = await getComments(route.params.id);
  } finally {
    loading.value = false;
  }
}

async function onFav() {
  const res = await toggleFavorite(product.value.id);
  product.value.is_favored = res.favored;
  product.value.favorite_count = res.favorite_count;
  ElMessage.success(res.favored ? '已加入收藏' : '已取消收藏');
}

async function onBuy() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }
  try {
    const { value } = await ElMessageBox.prompt(
      `向商家「${product.value.seller.nickname}」下单，可备注口味、忌口与取餐时间`,
      `确认下单 · ¥${formatPrice(product.value.price)}`,
      {
        confirmButtonText: '提交订单',
        cancelButtonText: '再想想',
        inputType: 'textarea',
        inputPlaceholder: '例如：微辣、不要香菜，12:20 下课后到取餐架拿',
        inputValidator: (v) => (v && v.trim() ? true : '请填写口味或取餐要求后再提交')
      }
    );
    await createOrder({ productId: product.value.id, remark: value.trim() });
    ElMessage.success('下单成功，可在「点餐订单」中等待商家接单');
    router.push('/orders');
  } catch { /* 用户取消 */ }
}

async function submitComment() {
  if (!commentText.value.trim()) return ElMessage.warning('请输入留言内容');
  const c = await addComment({ productId: product.value.id, content: commentText.value.trim() });
  comments.value.push(c);
  commentText.value = '';
  ElMessage.success('留言成功');
}

async function removeComment(id) {
  await ElMessageBox.confirm('确定删除这条留言吗？', '提示', { type: 'warning' });
  await deleteComment(id);
  comments.value = comments.value.filter((c) => c.id !== id);
  ElMessage.success('已删除');
}

onMounted(loadAll);
</script>

<style scoped>
.crumb { margin-bottom: 16px; }
.detail-wrap { display: grid; grid-template-columns: 460px 1fr; gap: 20px; }
.gallery { padding: 10px; }
.gallery :deep(.el-carousel) { width: 100%; }
.gallery-img { width: 100%; height: 100%; display: block; }
.main-card { padding: 26px; }

.title { font-size: 22px; margin: 0 0 14px; line-height: 1.4; }
.tags { display: flex; gap: 8px; margin-bottom: 18px; }

.price-box {
  background: linear-gradient(120deg, #fff5f0, #fff0f5);
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.price-line { display: flex; align-items: baseline; gap: 12px; }
.price-label { color: #9ca3af; font-size: 13px; }
.price { color: #f56c6c; font-size: 34px; font-weight: 800; }
.origin { color: #9ca3af; text-decoration: line-through; font-size: 13px; }
.save { color: #f56c6c; font-size: 13px; border: 1px solid #f56c6c; border-radius: 12px; padding: 2px 10px; }

.stat-row { display: flex; gap: 22px; color: #9ca3af; font-size: 13px; flex-wrap: wrap; }
.stat-row span { display: flex; align-items: center; gap: 4px; }

.seller-card {
  margin: 18px 0;
  padding: 14px 16px;
  background: #fdf6f1;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.seller-card:hover { background: #fcebe0; }
.seller-info { flex: 1; min-width: 0; }
.seller-name { font-weight: 600; font-size: 15px; }
.shop-tag {
  display: inline-block;
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
  color: #e8590c;
  background: #ffe9db;
  border-radius: 4px;
  padding: 1px 6px;
  vertical-align: middle;
}
.seller-bio { color: #9ca3af; font-size: 12px; margin-top: 2px; }
.arrow { color: #c0c4cc; }

.actions { display: flex; gap: 12px; margin-top: 20px; }
.buy-btn { padding: 0 34px; }

.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
.page-card h3 { margin: 0 0 14px; font-size: 17px; }
.desc-text { white-space: pre-wrap; line-height: 1.8; color: #4b5563; margin: 0; }

.comment-input { display: flex; gap: 10px; align-items: flex-start; }
.comment-submit { display: flex; justify-content: flex-end; margin-top: 10px; }
.comment-item { display: flex; gap: 10px; margin-bottom: 18px; }
.comment-body { flex: 1; }
.comment-head { display: flex; align-items: center; gap: 10px; }
.comment-name { font-weight: 600; font-size: 14px; }
.comment-time { color: #9ca3af; font-size: 12px; }
.comment-content { margin-top: 4px; color: #374151; font-size: 14px; line-height: 1.6; }

@media (max-width: 900px) {
  .detail-wrap, .bottom-grid { grid-template-columns: 1fr; }
}
</style>
