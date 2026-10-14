<template>
  <div class="product-card" @click="goDetail">
    <div class="cover">
      <el-image :src="product.images?.[0] || defaultImg" fit="cover" lazy class="cover-img" />
      <span v-if="product.status !== 'on'" class="status-mask">
        {{ product.status === 'sold' ? '已售罄' : '已下架' }}
      </span>
      <el-tag class="cond-tag" size="small" effect="dark" round>{{ product.item_condition }}</el-tag>
      <span
        class="fav-btn"
        :class="{ active: product.is_favored }"
        @click.stop="onFav"
      >
        <el-icon><Star :fill="product.is_favored ? '#f56c6c' : 'none'" /></el-icon>
      </span>
    </div>
    <div class="info">
      <div class="title text-ellipsis-2">{{ product.title }}</div>
      <div class="price-row">
        <span class="price">¥{{ formatPrice(product.price) }}</span>
        <span v-if="product.original_price" class="origin-price">¥{{ formatPrice(product.original_price) }}</span>
      </div>
      <div class="meta-row">
        <span class="seller" @click.stop="goSeller">
          <el-avatar :size="18" :src="product.seller?.avatar" />
          {{ product.seller?.nickname }}
        </span>
        <span class="views">
          <el-icon><View /></el-icon>
          {{ product.view_count }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { Star, View } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { toggleFavorite } from '@/api';
import { ElMessage } from 'element-plus';

const props = defineProps({ product: { type: Object, required: true } });
const emit = defineEmits(['changed']);
const router = useRouter();
const userStore = useUserStore();
const defaultImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%25" height="100%25" fill="%23e5e7eb"/></svg>';

function formatPrice(v) {
  return Number(v).toFixed(Number(v) % 1 === 0 ? 0 : 2);
}

function goDetail() {
  router.push(`/product/${props.product.id}`);
}
function goSeller() {
  if (props.product.seller_id || props.product.seller?.id) {
    router.push(`/user/${props.product.seller_id || props.product.seller.id}`);
  }
}

async function onFav() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再收藏');
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
    return;
  }
  const res = await toggleFavorite(props.product.id);
  props.product.is_favored = res.favored;
  props.product.favorite_count = res.favorite_count;
  ElMessage.success(res.favored ? '已加入收藏' : '已取消收藏');
  emit('changed');
}
</script>

<style scoped>
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s;
  border: 1px solid #eef0f5;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(255, 122, 47, 0.16);
}
.cover { position: relative; aspect-ratio: 4 / 3; background: #f0f2f7; }
.cover-img { width: 100%; height: 100%; display: block; }
.cond-tag { position: absolute; left: 8px; top: 8px; }
.status-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 4px;
}
.fav-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: transform 0.15s;
}
.fav-btn:hover { transform: scale(1.12); }
.fav-btn.active { color: #f56c6c; }

.info { padding: 10px 12px 12px; }
.title { font-size: 14px; line-height: 1.45; height: 40px; color: #1f2937; }
.price-row { margin-top: 8px; display: flex; align-items: baseline; gap: 8px; }
.price { color: #f56c6c; font-size: 19px; font-weight: 800; }
.origin-price { color: #9ca3af; font-size: 12px; text-decoration: line-through; }
.meta-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
}
.seller { display: flex; align-items: center; gap: 4px; max-width: 60%; overflow: hidden; }
.views { display: flex; align-items: center; gap: 3px; }
</style>
