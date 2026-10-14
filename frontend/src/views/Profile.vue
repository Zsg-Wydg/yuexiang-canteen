<template>
  <div class="container profile-page">
    <div class="page-card info-card">
      <h2>个人资料</h2>
      <div class="avatar-row">
        <el-avatar :size="80" :src="form.avatar" />
        <el-upload :show-file-list="false" :http-request="onUploadAvatar" accept="image/*">
          <el-button plain :icon="Upload">更换头像</el-button>
        </el-upload>
        <span class="tip">支持 jpg/png，大小不超过 5MB</span>
      </div>
      <el-form :model="form" label-width="80px" class="info-form">
        <el-form-item label="用户名">
          <el-input :model-value="userStore.user?.username" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" maxlength="20" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" maxlength="11" placeholder="方便接收点餐联系（选填）" />
        </el-form-item>
        <el-form-item label="个性签名">
          <el-input v-model="form.bio" type="textarea" :rows="2" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveProfile">保存资料</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card pwd-card">
      <h2>修改密码</h2>
      <el-form :model="pwd" label-width="80px" class="info-form">
        <el-form-item label="原密码">
          <el-input v-model="pwd.oldPassword" type="password" show-password show-word-limit placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwd.newPassword" type="password" show-password show-word-limit placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item>
          <el-button :loading="changingPwd" @click="savePassword">确认修改</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { Upload } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getMe, updateProfile, changePassword, uploadImage } from '@/api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const saving = ref(false);
const changingPwd = ref(false);
const form = reactive({ nickname: '', phone: '', bio: '', avatar: '' });
const pwd = reactive({ oldPassword: '', newPassword: '' });

onMounted(async () => {
  const u = userStore.user || await getMe();
  form.nickname = u.nickname;
  form.phone = u.phone;
  form.bio = u.bio;
  form.avatar = u.avatar;
});

async function onUploadAvatar({ file }) {
  const res = await uploadImage(file);
  form.avatar = res.url;
  ElMessage.success('头像已更新，记得点击「保存资料」');
}

async function saveProfile() {
  if (!form.nickname.trim()) return ElMessage.warning('昵称不能为空');
  saving.value = true;
  try {
    const u = await updateProfile(form);
    userStore.setUser(u);
    ElMessage.success('资料保存成功');
  } finally {
    saving.value = false;
  }
}

async function savePassword() {
  if (!pwd.oldPassword || !pwd.newPassword) return ElMessage.warning('请填写完整');
  changingPwd.value = true;
  try {
    await changePassword(pwd);
    ElMessage.success('密码修改成功，下次登录请使用新密码');
    pwd.oldPassword = '';
    pwd.newPassword = '';
  } finally {
    changingPwd.value = false;
  }
}
</script>

<style scoped>
.profile-page { max-width: 820px; display: flex; flex-direction: column; gap: 20px; }
.page-card h2 { margin: 0 0 20px; font-size: 19px; }
.avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.tip { color: #9ca3af; font-size: 12px; }
.info-form { max-width: 480px; }
</style>
