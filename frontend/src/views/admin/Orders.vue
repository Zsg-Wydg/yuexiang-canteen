<template>
  <h2 class="page-h">交易订单</h2>
  <div class="page-card">
    <div class="toolbar">
      <el-input
        v-model="keyword" placeholder="搜索订单号 / 菜品 / 买家 / 卖家" clearable style="width: 300px"
        @keyup.enter="load(1)" @clear="load(1)"
      />
      <el-select v-model="status" placeholder="全部状态" clearable style="width: 150px" @change="load(1)">
        <el-option label="待接单" value="pending" />
        <el-option label="已接单" value="agreed" />
        <el-option label="已拒单" value="rejected" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="canceled" />
      </el-select>
      <el-button type="primary" @click="load(1)">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" style="width: 100%">
      <el-table-column prop="order_no" label="订单号" width="170" />
      <el-table-column label="菜品" min-width="200">
        <template #default="{ row }">
          <div class="product-cell">
            <el-image
              v-if="row.product_images && row.product_images[0]"
              :src="row.product_images[0]"
              fit="cover" class="thumb"
            />
            <span class="title">{{ row.product_title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="buyer_name" label="买家" width="120" />
      <el-table-column prop="seller_name" label="卖家" width="120" />
      <el-table-column label="价格" width="100">
        <template #default="{ row }">
          <span class="price">¥{{ row.price.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="light">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column label="下单时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminGetOrders, adminDeleteOrder } from '@/api';

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const keyword = ref('');
const status = ref('');

const STATUS_MAP = {
  pending: { text: '待接单', type: 'warning' },
  agreed: { text: '已接单', type: 'primary' },
  rejected: { text: '已拒单', type: 'info' },
  completed: { text: '已完成', type: 'success' },
  canceled: { text: '已取消', type: 'danger' }
};
const statusText = (s) => STATUS_MAP[s]?.text || s;
const statusType = (s) => STATUS_MAP[s]?.type || 'info';

function formatTime(t) {
  if (!t) return '';
  return t.replace('T', ' ').slice(0, 16);
}

async function load(p = 1) {
  page.value = p;
  loading.value = true;
  try {
    const res = await adminGetOrders({
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

async function remove(row) {
  await ElMessageBox.confirm(`确定删除订单「${row.order_no}」吗？此操作不可恢复。`, '危险操作', {
    type: 'error', confirmButtonText: '确定删除'
  });
  await adminDeleteOrder(row.id);
  ElMessage.success('已删除');
  load(page.value);
}

onMounted(() => load(1));
</script>

<style scoped>
.page-h { margin: 0 0 20px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 18px; }
.pager { margin-top: 18px; justify-content: flex-end; }
.product-cell { display: flex; align-items: center; gap: 10px; }
.thumb { width: 44px; height: 44px; border-radius: 6px; flex-shrink: 0; }
.title { font-weight: 600; }
.price { color: #e67e22; font-weight: 700; }
</style>
