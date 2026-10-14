<template>
  <div class="container publish-page" v-loading="loading">
    <div class="page-card">
      <h2 class="page-title">{{ isEdit ? '编辑菜品' : '上架菜品' }}</h2>
      <p class="page-sub">填写菜品信息，诱人的实拍图与详细介绍更能吸引同学下单哦～</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px" class="publish-form">
        <el-form-item label="菜品名称" prop="title">
          <el-input v-model="form.title" maxlength="40" show-word-limit placeholder="例如：招牌黄焖鸡米饭" />
        </el-form-item>

        <el-form-item label="菜品分类" prop="category">
          <el-radio-group v-model="form.category">
            <el-radio-button v-for="c in categories" :key="c" :value="c">{{ c }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="风味标签" prop="item_condition">
          <el-radio-group v-model="form.item_condition">
            <el-radio v-for="c in conditions" :key="c" :value="c">{{ c }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="售价" prop="price">
          <el-input-number v-model="form.price" :min="0" :max="999999" :precision="2" :step="5" controls-position="right" />
          <span class="unit">元</span>
        </el-form-item>

        <el-form-item label="门市价">
          <el-input-number v-model="form.original_price" :min="0" :max="999999" :precision="2" :step="5" controls-position="right" />
          <span class="unit">元（选填，用于展示优惠力度）</span>
        </el-form-item>

        <el-form-item label="菜品图片">
          <el-upload
            list-type="picture-card"
            :file-list="fileList"
            :http-request="customUpload"
            :before-upload="beforeUpload"
            :limit="3"
            accept="image/*"
            @remove="handleRemove"
            @preview="handlePreview"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="upload-tip">最多上传 3 张实拍图，单张不超过 5MB；不填则使用默认封面</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="菜品介绍" prop="description">
          <el-input
            v-model="form.description" type="textarea" :rows="5"
            maxlength="500" show-word-limit
            placeholder="介绍主要食材、口味份量、辣度、出餐时间，以及是否支持忌口备注等"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="onSubmit">
            {{ isEdit ? '保存修改' : '确认上架' }}
          </el-button>
          <el-button size="large" @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog v-model="previewVisible" title="图片预览" width="520px">
      <img :src="previewUrl" style="width: 100%" alt="预览" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getMeta, getProduct, createProduct, updateProduct, uploadImage } from '@/api';

const route = useRoute();
const router = useRouter();
const formRef = ref();
const loading = ref(false);
const submitting = ref(false);
const categories = ref([]);
const conditions = ref([]);
const fileList = ref([]);
const previewVisible = ref(false);
const previewUrl = ref('');

const editId = route.query.id;
const isEdit = computed(() => !!editId);

const form = reactive({
  title: '', category: '', item_condition: '九成新',
  price: null, original_price: null,
  description: '', images: []
});

const rules = {
  title: [{ required: true, min: 2, message: '请输入至少 2 个字的菜品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择菜品分类', trigger: 'change' }],
  item_condition: [{ required: true, message: '请选择风味标签', trigger: 'change' }],
  price: [{ required: true, validator: (r, v, cb) => v != null && v >= 0 ? cb() : cb(new Error('请输入合法价格')), trigger: 'blur' }]
};

function beforeUpload(file) {
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB');
    return false;
  }
  return true;
}

// 自定义上传：调用后端 /api/upload
async function customUpload({ file, onSuccess, onError }) {
  try {
    const res = await uploadImage(file);
    form.images.push(res.url);
    onSuccess?.(res);
  } catch (e) {
    onError?.(e);
  }
}

function handleRemove(uploadFile) {
  const url = uploadFile.response?.url || uploadFile.url;
  form.images = form.images.filter((u) => u !== url);
}

function handlePreview(uploadFile) {
  previewUrl.value = uploadFile.response?.url || uploadFile.url;
  previewVisible.value = true;
}

async function onSubmit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = { ...form, images: form.images };
    if (isEdit.value) {
      await updateProduct(editId, payload);
      ElMessage.success('修改已保存');
      router.push('/my-products');
    } else {
      await createProduct(payload);
      ElMessage.success('菜品上架成功！');
      router.push('/my-products');
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  const meta = await getMeta();
  categories.value = meta.categories;
  conditions.value = meta.conditions;
  form.category = meta.categories[0];

  if (isEdit.value) {
    loading.value = true;
    try {
      const p = await getProduct(editId);
      Object.assign(form, {
        title: p.title,
        category: p.category,
        item_condition: p.item_condition,
        price: p.price,
        original_price: p.original_price || null,
        description: p.description,
        images: [...p.images]
      });
      fileList.value = p.images.map((url) => ({ name: url, url, status: 'success' }));
    } finally {
      loading.value = false;
    }
  }
});
</script>

<style scoped>
.publish-page { max-width: 820px; }
.page-card { padding: 30px 36px; }
.page-title { margin: 0; font-size: 24px; }
.page-sub { color: #9ca3af; margin: 8px 0 26px; font-size: 14px; }
.unit { margin-left: 10px; color: #9ca3af; font-size: 13px; }
.upload-tip { color: #9ca3af; font-size: 12px; margin-top: 4px; }
</style>
