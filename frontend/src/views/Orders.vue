<template>
  <div class="container" v-loading="loading">
    <div class="page-card">
      <el-tabs v-model="activeRole" @tab-change="load">
        <el-tab-pane label="我下单的" name="buyer" />
        <el-tab-pane label="门店接单" name="seller" />
      </el-tabs>

      <div v-if="orders.length" class="order-list">
        <div v-for="o in orders" :key="o.id" class="order-item">
          <div class="order-head">
            <span class="order-no">订单号：{{ o.order_no }}</span>
            <span class="order-time">{{ formatTime(o.created_at) }}</span>
            <el-tag :type="statusMeta(o.status).type" effect="light" class="status-tag">
              {{ statusMeta(o.status).text }}
            </el-tag>
          </div>
          <div class="order-body" @click="$router.push(`/product/${o.product_id}`)">
            <el-image :src="o.product?.images?.[0]" class="thumb" fit="cover" />
            <div class="order-info">
              <div class="order-title text-ellipsis-2">{{ o.product?.title || '菜品已删除' }}</div>
              <div class="order-party">
                {{ activeRole === 'buyer' ? '商家' : '顾客' }}：
                {{ activeRole === 'buyer' ? o.seller?.nickname : o.buyer?.nickname }}
                <span v-if="partyPhone(o)" class="phone">📞 {{ partyPhone(o) }}</span>
              </div>
              <div v-if="o.remark" class="order-remark">备注：{{ o.remark }}</div>
            </div>
            <div class="order-price">¥{{ formatPrice(o.price) }}</div>
          </div>
          <div class="order-actions">
            <!-- 顾客操作 -->
            <template v-if="activeRole === 'buyer'">
              <el-button v-if="['pending', 'agreed'].includes(o.status)" plain round @click="act(o, 'cancel')">取消订单</el-button>
              <el-button v-if="o.status === 'agreed'" type="success" round @click="act(o, 'complete')">确认取餐</el-button>
              <span v-if="o.status === 'pending'" class="wait-tip">等待商家接单…</span>
              <span v-if="o.status === 'rejected'" class="wait-tip">商家已拒单，可看看其他菜品</span>
              <span v-if="o.status === 'completed'" class="wait-tip success">订单已完成，用餐愉快 🎉</span>
            </template>
            <!-- 商家操作 -->
            <template v-else>
              <template v-if="o.status === 'pending'">
                <el-button type="primary" round @click="act(o, 'agree')">接单</el-button>
                <el-button plain round @click="act(o, 'reject')">拒单</el-button>
              </template>
              <el-button v-if="o.status === 'agreed'" type="success" plain round disabled>已接单，等待顾客到店取餐</el-button>
              <span v-if="o.status === 'completed'" class="wait-tip success">订单已完成 🎉</span>
              <span v-if="o.status === 'rejected'" class="wait-tip">已拒单</span>
            </template>
          </div>
        </div>
      </div>
      <el-empty v-else-if="!loading" :description="activeRole === 'buyer' ? '还没有下过单，去挑点好吃的吧' : '还没有顾客下单'" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getOrders, orderAction } from '@/api';

const loading = ref(false);
const activeRole = ref('buyer');
const orders = ref([]);

const STATUS_MAP = {
  pending: { text: '待商家接单', type: 'warning' },
  agreed: { text: '商家已接单', type: 'primary' },
  rejected: { text: '商家已拒单', type: 'danger' },
  completed: { text: '已完成', type: 'success' },
  canceled: { text: '已取消', type: 'info' }
};
const statusMeta = (s) => STATUS_MAP[s] || { text: s, type: 'info' };

function formatPrice(v) {
  return Number(v).toFixed(Number(v) % 1 === 0 ? 0 : 2);
}
function formatTime(t) {
  return new Date(t).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
}
function partyPhone(o) {
  return activeRole.value === 'buyer' ? o.seller?.phone : o.buyer?.phone;
}

async function load() {
  loading.value = true;
  try {
    orders.value = await getOrders({ role: activeRole.value });
  } finally {
    loading.value = false;
  }
}

async function act(o, action) {
  const tips = {
    agree: '接单后请尽快备餐，确定接单吗？',
    reject: '确定拒绝这笔订单吗？',
    cancel: '确定取消这笔订单吗？',
    complete: '请确认已到店取到餐品，确认后订单完成！'
  };
  await ElMessageBox.confirm(tips[action], '操作确认', {
    type: action === 'complete' ? 'success' : 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '再想想'
  });
  await orderAction(o.id, action);
  ElMessage.success('操作成功');
  load();
}

onMounted(load);
</script>

<style scoped>
.order-list { display: flex; flex-direction: column; gap: 16px; }
.order-item {
  border: 1px solid #f3e6dc;
  border-radius: 12px;
  overflow: hidden;
}
.order-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  background: #fdf6f1;
  font-size: 13px;
  color: #8a6f5c;
}
.order-no { font-weight: 600; }
.status-tag { margin-left: auto; }
.order-body {
  display: flex;
  gap: 16px;
  padding: 16px 18px;
  cursor: pointer;
}
.order-body:hover { background: #fffaf6; }
.thumb { width: 80px; height: 80px; border-radius: 8px; flex-shrink: 0; }
.order-info { flex: 1; min-width: 0; }
.order-title { font-size: 15px; font-weight: 600; max-width: 560px; }
.order-party { font-size: 13px; color: #8a6f5c; margin-top: 8px; }
.phone { margin-left: 12px; color: #e8590c; }
.order-remark { font-size: 13px; color: #b08968; margin-top: 6px; }
.order-price { color: #f56c6c; font-size: 20px; font-weight: 800; white-space: nowrap; }
.order-actions {
  padding: 0 18px 14px;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}
.wait-tip { font-size: 13px; color: #b08968; margin-right: auto; }
.wait-tip.success { color: #67c23a; }
</style>
