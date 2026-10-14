<template>
  <div class="container" v-loading="loading">
    <div class="head">
      <h2>我的收藏 <span class="count">共 {{ products.length }} 道</span></h2>
    </div>
    <div v-if="products.length" class="product-grid">
      <ProductCard v-for="p in products" :key="p.id" :product="p" @changed="load" />
    </div>
    <el-empty v-else-if="!loading" description="还没有收藏任何菜品">
      <el-button type="primary" @click="$router.push('/')">去点餐</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ProductCard from '@/components/ProductCard.vue';
import { getFavorites } from '@/api';

const loading = ref(false);
const products = ref([]);

async function load() {
  loading.value = true;
  try {
    products.value = await getFavorites();
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>

<style scoped>
.head { margin-bottom: 16px; }
.head h2 { margin: 0; display: inline-block; }
.count { font-size: 14px; color: #9ca3af; font-weight: normal; margin-left: 8px; }
</style>
