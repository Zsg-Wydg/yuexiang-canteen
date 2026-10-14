<template>
  <div class="container" v-loading="loading">
    <div class="head">
      <h2>我的菜品</h2>
      <el-button type="primary" :icon="Plus" @click="$router.push('/publish')">上架新菜品</el-button>
    </div>

    <div class="page-card">
      <el-table :data="products" style="width: 100%" empty-text="还没有上架过菜品">
        <el-table-column label="菜品" min-width="280">
          <template #default="{ row }">
            <div class="prod-cell" @click="$router.push(`/product/${row.id}`)">
              <el-image :src="row.images[0]" class="thumb" fit="cover" />
              <div>
                <div class="prod-title text-ellipsis-2">{{ row.title }}</div>
                <el-tag size="small" type="info">{{ row.category }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="售价" width="110">
          <template #default="{ row }"><span class="text-price">¥{{ row.price }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览" width="90" />
        <el-table-column prop="favorite_count" label="收藏" width="90" />
        <el-table-column label="上架时间" width="120">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/publish?id=${row.id}`)">编辑</el-button>
            <el-dropdown trigger="click" @command="(c) => changeStatus(row, c)">
              <el-button link type="primary">改状态<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="on">上架供应</el-dropdown-item>
                  <el-dropdown-item command="off">下架</el-dropdown-item>
                  <el-dropdown-item command="sold">标记售罄</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMyProducts, updateProductStatus, deleteProduct } from '@/api';

const loading = ref(false);
const products = ref([]);

const statusText = (s) => ({ on: '供应中', off: '已下架', sold: '已售罄' }[s]);
const statusType = (s) => ({ on: 'success', off: 'info', sold: 'warning' }[s]);
function formatDate(t) {
  return new Date(t).toLocaleDateString('zh-CN');
}

async function load() {
  loading.value = true;
  try {
    products.value = await getMyProducts();
  } finally {
    loading.value = false;
  }
}

async function changeStatus(row, status) {
  await updateProductStatus(row.id, status);
  row.status = status;
  ElMessage.success('状态已更新');
}

async function remove(row) {
  await ElMessageBox.confirm(`确定删除「${row.title}」吗？删除后不可恢复`, '删除菜品', { type: 'warning' });
  await deleteProduct(row.id);
  products.value = products.value.filter((p) => p.id !== row.id);
  ElMessage.success('删除成功');
}

onMounted(load);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.head h2 { margin: 0; }
.prod-cell { display: flex; gap: 12px; align-items: center; cursor: pointer; }
.thumb { width: 64px; height: 48px; border-radius: 6px; flex-shrink: 0; }
.prod-title { font-size: 14px; max-width: 200px; margin-bottom: 4px; }
</style>
