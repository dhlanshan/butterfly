<script setup lang="ts">
/**
 * 账号管理
 * 用于测试 keep-alive 缓存：在输入框里输入内容，切到别的菜单再切回来，
 * 若 keepAlive=true 则内容保留（缓存命中），若 keepAlive=false 则内容清空（重新挂载）。
 */
import {ref} from "vue";

const keyword = ref("");
const remark = ref("");
</script>

<template>
  <div style="padding: 16px;">
    <h3>{{ $t("menu.account") }}</h3>
    <p style="margin: 12px 0; color: #909399; font-size: 13px;">
      用于测试 keep-alive 缓存：输入内容后切到别的菜单，再切回来看内容是否保留。
    </p>
    <el-form label-width="80px" style="max-width: 480px;">
      <el-form-item label="关键词">
        <el-input v-model="keyword" placeholder="请输入关键词"/>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="remark" type="textarea" :rows="3" placeholder="请输入备注"/>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">

</style>
