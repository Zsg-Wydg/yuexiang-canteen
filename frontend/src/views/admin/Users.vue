<template>
  <h2 class="page-h">用户管理</h2>
  <div class="page-card">
    <div class="toolbar">
      <el-input
        v-model="keyword" placeholder="按用户名或昵称搜索" clearable style="width: 260px"
        @keyup.enter="load(1)" @clear="load(1)"
      />
      <el-button type="primary" @click="load(1)">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="用户名" width="150">
        <template #default="{ row }">
          <b>{{ row.username }}</b>
          <el-tag v-if="row.role === 'admin'" size="small" type="danger" effect="plain" style="margin-left:6px">管理员</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" width="160" />
      <el-table-column prop="phone" label="手机号" width="150" />
      <el-table-column prop="product_count" label="发布数" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '正常' : '已封禁' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="130">
        <template #default="{ row }">{{ row.created_at.slice(0, 10) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <template v-if="row.role !== 'admin'">
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'" link
              @click="toggleBan(row)"
            >{{ row.status === 'active' ? '封禁' : '解封' }}</el-button>
            <el-button type="danger" link @click="remove(row)">删除</el-button>
          </template>
          <span v-else style="color:#c0c4cc">—</span>
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
import { adminGetUsers, adminSetUserStatus, adminDeleteUser } from '@/api';

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const keyword = ref('');

async function load(p = 1) {
  page.value = p;
  loading.value = true;
  try {
    const res = await adminGetUsers({ page: p, keyword: keyword.value || undefined });
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function toggleBan(row) {
  const next = row.status === 'active' ? 'banned' : 'active';
  await ElMessageBox.confirm(`确定要${next === 'banned' ? '封禁' : '解封'}用户「${row.nickname}」吗？`, '提示', { type: 'warning' });
  await adminSetUserStatus(row.id, next);
  row.status = next;
  ElMessage.success('操作成功');
}

async function remove(row) {
  await ElMessageBox.confirm(`删除用户「${row.nickname}」将同时删除其菜品与订单记录，确定吗？`, '危险操作', {
    type: 'error', confirmButtonText: '确定删除'
  });
  await adminDeleteUser(row.id);
  ElMessage.success('已删除');
  load(page.value);
}

onMounted(() => load(1));
</script>

<style scoped>
.page-h { margin: 0 0 20px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 18px; }
.pager { margin-top: 18px; justify-content: flex-end; }
</style>
