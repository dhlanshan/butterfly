<script setup lang="ts">
import {ElMessage, type FormInstance, type FormRules} from "element-plus"
import {User, Lock} from '@element-plus/icons-vue'
import {useUserStoreHook} from "@/store/modules/user"
import {useRouter} from 'vue-router'

// 类型定义
interface RuleForm {
  username: string
  password: string
}


// 变量声明
const router = useRouter()
const ruleForm = reactive<RuleForm>({
  username: '',
  password: '',
})
const ruleFormRef = ref<FormInstance>()

// 校验规则，每个字段都和el-form-item的prop对应
const rules = reactive<FormRules<RuleForm>>({
  username: [
    {required: true, message: "账号不能为空", trigger: 'blur'}
  ],
  password: [
    {required: true, message: "密码不能为空", trigger: "blur"}
  ]
})

// 按钮状态
const loading = ref<boolean>(false)

// 登录处理
const onLogin = async (formEl: FormInstance | undefined) => {
  // 表单验证
  if (!formEl) return;
  const valid = await formEl.validate();
  if (!valid) return;

  try {
    loading.value = true;
    // 执行登录
    await useUserStoreHook().login(ruleForm);
    // 获取用户信息
    await useUserStoreHook().getUserInfo()
    // 弹窗
    ElMessage.success("登录成功");
    // 跳转首页
    router.replace("/home")

  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-form-box">
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="auto" style="max-width: 600px">
      <el-form-item prop="username">
        <el-input v-model="ruleForm.username" :prefix-icon="User" :clearable="true" placeholder="请输入账号"/>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="ruleForm.password" :prefix-icon="Lock" :clearable="true" :show-password="true"
                  placeholder="请输入密码"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" style="width: 100%" @click="onLogin(ruleFormRef)" :loading="loading">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.login-form-box {
  margin-top: 28px;
}
</style>