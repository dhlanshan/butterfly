<script setup lang="ts">
/**
 * 插件示例页
 * 对应 mock 菜单 component: "plugins/example/examplelist"，
 * 由 moduleMatch 解析为 () => import("@/views/plugins/example/examplelist.vue")。
 * 占位页，用于打通混合菜单 / 路由；实际插件列表请替换为接口数据。
 */
import {ref} from "vue";

const keyword = ref("");
const remark = ref("");

const list = ref([
    {id: 1, name: "示例插件 A", version: "1.0.0", status: "已启用"},
    {id: 2, name: "示例插件 B", version: "0.9.2", status: "已停用"},
]);
</script>

<template>
  <div class="plugin-example-page">
    <h3>{{ $t("menu.plugin-example") }}</h3>
    <p class="hint">占位页：输入内容后切走再切回，可测 keep-alive（该路由 keepAlive=true）。</p>
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
      <el-table-column prop="name" label="插件名称"/>
      <el-table-column prop="version" label="版本" width="120"/>
      <el-table-column prop="status" label="状态" width="120"/>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.plugin-example-page {
  padding: 16px;

  h3 {
    margin-bottom: 8px;
    font-weight: 600;
  }

  .hint {
    margin: 0 0 16px;
    color: #909399;
    font-size: 13px;
  }
}
</style>
