<template>
  <h2 class="page-h">数据概览</h2>
  <div class="stat-grid" v-loading="loading">
    <div class="stat-card c1">
      <div class="stat-icon">👥</div>
      <div>
        <div class="num">{{ stats.users }}</div>
        <div class="label">注册用户</div>
      </div>
    </div>
    <div class="stat-card c2">
      <div class="stat-icon">🍲</div>
      <div>
        <div class="num">{{ stats.products }}</div>
        <div class="label">菜品总数（供应中 {{ stats.onSale }}）</div>
      </div>
    </div>
    <div class="stat-card c3">
      <div class="stat-icon">🧾</div>
      <div>
        <div class="num">{{ stats.orders }}</div>
        <div class="label">订单总数（已完成 {{ stats.completed }}）</div>
      </div>
    </div>
  </div>

  <div class="chart-row">
    <div class="page-card">
      <h3>近 7 天每日新增菜品</h3>
      <div v-if="trend.length" class="bars">
        <div v-for="t in trend" :key="t.date" class="bar-item">
          <div class="bar" :style="{ height: Math.max(8, t.count * 46) + 'px' }">
            <span class="bar-num">{{ t.count }}</span>
          </div>
          <span class="bar-date">{{ t.date.slice(5) }}</span>
        </div>
      </div>
      <el-empty v-else description="最近 7 天暂无新增" :image-size="70" />
    </div>

    <div class="page-card">
      <h3>菜品分类分布</h3>
      <div class="cat-list">
        <div v-for="c in stats.categories" :key="c.category" class="cat-row">
          <span class="cat-name">{{ c.category }}</span>
          <el-progress
            :percentage="totalProducts ? Math.round(c.count / totalProducts * 100) : 0"
            :stroke-width="14" :show-text="false" class="cat-progress"
          />
          <span class="cat-count">{{ c.count }} 件</span>
        </div>
        <el-empty v-if="!stats.categories?.length" description="暂无数据" :image-size="70" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { adminGetStats } from '@/api';

const loading = ref(false);
const stats = ref({ users: 0, products: 0, onSale: 0, orders: 0, completed: 0, trend: [], categories: [] });
const trend = computed(() => stats.value.trend || []);
const totalProducts = computed(() => stats.value.products || 0);

onMounted(async () => {
  loading.value = true;
  try {
    stats.value = await adminGetStats();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-h { margin: 0 0 20px; }
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 20px; }
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 2px 12px rgba(31, 41, 55, 0.05);
}
.stat-icon {
  width: 58px; height: 58px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
}
.c1 .stat-icon { background: #ecf0fe; }
.c2 .stat-icon { background: #e6f9f1; }
.c3 .stat-icon { background: #fff4e8; }
.num { font-size: 30px; font-weight: 800; }
.label { color: #9ca3af; font-size: 13px; margin-top: 2px; }

.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.page-card h3 { margin: 0 0 20px; font-size: 16px; }
.bars { display: flex; align-items: flex-end; gap: 18px; height: 180px; padding-top: 10px; }
.bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.bar {
  width: 100%;
  max-width: 42px;
  background: linear-gradient(180deg, #ffb066, #ff7a2f);
  border-radius: 6px 6px 0 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.bar-num { color: #fff; font-size: 12px; margin-top: 4px; }
.bar-date { font-size: 12px; color: #9ca3af; }

.cat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.cat-name { width: 70px; font-size: 14px; color: #4b5563; flex-shrink: 0; }
.cat-progress { flex: 1; }
.cat-count { width: 46px; text-align: right; font-size: 13px; color: #6b7280; }
</style>
