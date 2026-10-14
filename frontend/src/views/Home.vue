<template>
  <div class="container">
    <!-- Banner -->
    <section class="banner">
      <div class="banner-text">
        <h1>校园美味<span>一键</span>即达</h1>
        <p>热菜、粉面、轻食、奶茶……在线点单，到店即取，告别饭排长队</p>
        <el-button type="warning" size="large" round @click="goPublish">
          <el-icon style="margin-right: 6px"><Plus /></el-icon>我是商家，上架菜品
        </el-button>
      </div>
      <div class="banner-emoji">🍱</div>
    </section>

    <!-- 分类 + 排序 -->
    <section class="toolbar page-card">
      <div class="cats">
        <span
          v-for="c in categories"
          :key="c"
          class="cat-chip"
          :class="{ active: query.category === c }"
          @click="changeCategory(c)"
        >{{ c }}</span>
      </div>
      <el-divider direction="vertical" style="height: 24px" />
      <el-radio-group v-model="query.sort" size="default" @change="loadData(1)">
        <el-radio-button value="newest">最新发布</el-radio-button>
        <el-radio-button value="price_asc">价格最低</el-radio-button>
        <el-radio-button value="price_desc">价格最高</el-radio-button>
        <el-radio-button value="hot">最多人看</el-radio-button>
      </el-radio-group>
    </section>

    <p class="result-tip" v-if="query.keyword">
      搜索 “<b>{{ query.keyword }}</b>” 共找到 {{ total }} 道菜品
    </p>

    <!-- 菜品网格 -->
    <section v-loading="loading">
      <div v-if="list.length" class="product-grid">
        <ProductCard v-for="p in list" :key="p.id" :product="p" />
      </div>
      <el-empty v-else-if="!loading" description="暂时没有符合条件的菜品" />
    </section>

    <div class="pager" v-if="total > query.pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="query.pageSize"
        :current-page="query.page"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import ProductCard from '@/components/ProductCard.vue';
import { getMeta, getProducts } from '@/api';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const categories = ref([]);
const list = ref([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ keyword: '', category: '', sort: 'newest', page: 1, pageSize: 12 });

function syncFromRoute() {
  query.keyword = route.query.keyword || '';
  query.category = route.query.category || '';
  query.page = Number(route.query.page) || 1;
  query.sort = route.query.sort || 'newest';
}

async function loadData(page) {
  if (page) query.page = page;
  loading.value = true;
  try {
    const res = await getProducts({
      keyword: query.keyword || undefined,
      category: query.category || undefined,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize
    });
    list.value = res.list;
    total.value = res.total;
    router.replace({ query: {
      keyword: query.keyword || undefined,
      category: query.category || undefined,
      sort: query.sort === 'newest' ? undefined : query.sort,
      page: query.page > 1 ? query.page : undefined
    }});
  } finally {
    loading.value = false;
  }
}

function changeCategory(c) {
  query.category = query.category === c ? '' : c;
  loadData(1);
}

function goPublish() {
  if (!userStore.isLoggedIn) router.push({ name: 'login', query: { redirect: '/publish' } });
  else router.push('/publish');
}
watch(() => route.query, () => {
  syncFromRoute();
  loadData();
});

onMounted(async () => {
  const meta = await getMeta();
  categories.value = meta.categories;
  syncFromRoute();
  loadData();
});
</script>

<style scoped>
.banner {
  border-radius: 16px;
  padding: 44px 48px;
  margin-bottom: 20px;
  background: linear-gradient(120deg, #ff8a3d 0%, #e8590c 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
}
.banner-text h1 { font-size: 36px; margin: 0 0 10px; font-weight: 800; }
.banner-text h1 span { color: #fff3c4; }
.banner-text p { opacity: 0.95; margin: 0 0 22px; font-size: 15px; }
.banner-emoji { font-size: 110px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2)); }

.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  margin-bottom: 18px;
}
.cats { display: flex; gap: 8px; flex-wrap: wrap; }
.cat-chip {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #4b5563;
  background: #f3f4f8;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.cat-chip:hover { color: var(--brand); background: #ecf0fe; }
.cat-chip.active { background: var(--brand); color: #fff; }

.result-tip { color: #6b7280; font-size: 14px; margin: 0 0 14px 4px; }
.pager { display: flex; justify-content: center; margin-top: 30px; }
</style>
