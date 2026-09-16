<script setup lang="ts">
/**
 * 「许可列表」示例页
 * - 这是自定义静态路由 customStaticRoutes 的示例页面。
 * - 对应 basic.ts 中 customStaticRoutes 的 { component: "license/license" }，
 *   由 moduleMatch 解析为 () => import("@/views/license/license.vue")。
 * - 你可以基于此文件改成自己的页面，或在 customStaticRoutes 里追加更多自定义路由。
 * - 也用于测试 keep-alive 缓存：输入内容后切走再切回，看是否保留。
 */
import {ref} from "vue";

// 测试 keep-alive 用的输入状态
const keyword = ref("");
const remark = ref("");

// 示例：许可列表数据（占位，实际请替换为接口请求）
const list = ref([
    {id: 1, name: "Core Module", type: "永久", expire: "—", status: "生效中"},
    {id: 2, name: "AI 对话插件", type: "订阅", expire: "2026-12-31", status: "生效中"},
    {id: 3, name: "数据大屏插件", type: "订阅", expire: "2025-08-01", status: "已过期"},
]);
</script>

<template>
  <div class="license-page">
    <h3>{{ $t("menu.license") }}</h3>
    <p style="margin: 12px 0; color: #909399; font-size: 13px;">
      用于测试 keep-alive 缓存：输入内容后切到别的菜单，再切回来看内容是否保留。
    </p>
    <el-form label-width="80px" style="max-width: 480px; margin-bottom: 16px;">
      <el-form-item label="关键词">
        <el-input v-model="keyword" placeholder="请输入关键词"/>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="remark" type="textarea" :rows="3" placeholder="请输入备注"/>
      </el-form-item>
    </el-form>
    <el-table :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80"/>
      <el-table-column prop="name" label="许可名称"/>
      <el-table-column prop="type" label="类型" width="120"/>
      <el-table-column prop="expire" label="到期时间" width="160"/>
      <el-table-column prop="status" label="状态" width="120"/>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.license-page {
  padding: 16px;

  h3 {
    margin-bottom: 16px;
    font-weight: 600;
  }
}
</style>
