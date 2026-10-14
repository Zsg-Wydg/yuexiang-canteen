<template>
  <div class="container" v-loading="loading">
    <div v-if="user" class="page-card user-head">
      <el-avatar :size="72" :src="user.avatar" />
      <div class="user-meta">
        <h2>{{ user.nickname }}</h2>
        <p class="bio">{{ user.bio }}</p>
        <div class="stats">
          <span>供应中 <b>{{ user.on_sale_count }}</b></span>
          <el-divider direction="vertical" />
          <span>已售罄 <b>{{ user.sold_count }}</b></span>
          <el-divider direction="vertical" />
          <span>入驻于 {{ formatDate(user.created_at) }}</span>
        </div>
      </div>
    </div>

    <h3 class="section-title">TA 家供应中的菜品</h3>
    <div v-if="products.length" class="product-grid">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>
    <el-empty v-else-if="!loading" description="TA 家暂时没有供应中的菜品" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import ProductCard from '@/components/ProductCard.vue';
import { getUserProfile, getProducts } from '@/api';

const route = useRoute();
const loading = ref(false);
const user = ref(null);
const products = ref([]);

function formatDate(t) {
  return new Date(t).toLocaleDateString('zh-CN');
}

async function load() {
  loading.value = true;
  try {
    user.value = await getUserProfile(route.params.id);
    const res = await getProducts({ sellerId: route.params.id, status: 'on', pageSize: 50 });
    products.value = res.list;
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, load);
onMounted(load);
</script>

<style scoped>
.user-head { display: flex; gap: 20px; align-items: center; margin-bottom: 24px; }
.user-meta h2 { margin: 0 0 6px; }
.bio { color: #6b7280; font-size: 14px; margin: 0 0 10px; }
.stats { color: #9ca3af; font-size: 13px; }
.stats b { color: #1f2937; margin: 0 2px; }
.section-title { margin: 0 0 16px; font-size: 18px; }
</style>
