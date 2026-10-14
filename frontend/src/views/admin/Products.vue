<template>
  <h2 class="page-h">菜品管理</h2>
  <div class="page-card">
    <div class="toolbar">
      <el-input
        v-model="keyword" placeholder="按菜品名称搜索" clearable style="width: 260px"
        @keyup.enter="load(1)" @clear="load(1)"
      />
      <el-select v-model="status" placeholder="全部状态" clearable style="width: 140px" @change="load(1)">
        <el-option label="供应中" value="on" />
        <el-option label="已下架" value="off" />
        <el-option label="已售罄" value="sold" />
      </el-select>
      <el-button type="primary" @click="load(1)">筛选</el-button>
    </div>

    <el-table :data="list" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="菜品" min-width="280">
        <template #default="{ row }">
          <div class="prod-cell" @click="$router.push(`/product/${row.id}`)">
            <el-image :src="row.images[0]" class="thumb" fit="cover" />
            <div>
              <div class="prod-title text-ellipsis-2">{{ row.title }}</div>
              <el-tag size="small" type="info">{{ row.category }} · {{ row.item_condition }}</el-tag>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="售价" width="110">
        <template #default="{ row }"><span class="text-price">¥{{ row.price }}</span></template>
      </el-table-column>
      <el-table-column prop="seller_name" label="商家" width="130" />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="上架时间" width="120">
        <template #default="{ row }">{{ row.created_at.slice(0, 10) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="210">
        <template #default="{ row }">
          <el-dropdown trigger="click" @command="(c) => changeStatus(row, c)">
            <el-button link type="primary">改状态<el-icon><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="on">设为供应</el-dropdown-item>
                <el-dropdown-item command="off">强制下架</el-dropdown-item>
                <el-dropdown-item command="sold">标记售罄</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pager" background layout="total, prev, pager, next"
      :total="total" :page-size="10" :current-page="page" @current-change="load"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminGetProducts, adminSetProductStatus, adminDeleteProduct } from '@/api';

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const keyword = ref('');
const status = ref('');

const statusText = (s) => ({ on: '供应中', off: '已下架', sold: '已售罄' }[s]);
const statusType = (s) => ({ on: 'success', off: 'info', sold: 'warning' }[s]);

async function load(p = 1) {
  page.value = p;
  loading.value = true;
  try {
    const res = await adminGetProducts({
      page: p,
      keyword: keyword.value || undefined,
      status: status.value || undefined
    });
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function changeStatus(row, s) {
  await adminSetProductStatus(row.id, s);
  row.status = s;
  ElMessage.success('状态已更新');
}

async function remove(row) {
  await ElMessageBox.confirm(`确定删除菜品「${row.title}」吗？`, '危险操作', {
    type: 'error', confirmButtonText: '确定删除'
  });
  await adminDeleteProduct(row.id);
  ElMessage.success('已删除');
  load(page.value);
}

onMounted(() => load(1));
</script>

<style scoped>
.page-h { margin: 0 0 20px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 18px; }
.pager { margin-top: 18px; justify-content: flex-end; }
.prod-cell { display: flex; gap: 12px; align-items: center; cursor: pointer; }
.thumb { width: 64px; height: 48px; border-radius: 6px; flex-shrink: 0; }
.prod-title { font-size: 14px; max-width: 200px; margin-bottom: 4px; }
</style>
