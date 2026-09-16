<script setup lang="ts">
/**
 * 任务日志页
 * 对应 mock 菜单 component: "system/sysjobresults/sysjobresultslist"，
 * 由 moduleMatch 解析为 () => import("@/views/system/sysjobresults/sysjobresultslist.vue")。
 * 占位页，用于打通混合菜单 / 路由；实际日志列表请替换为接口数据。
 */
import {ref} from "vue";

const keyword = ref("");
const remark = ref("");

const list = ref([
    {id: 1, job: "每日数据同步", time: "2026-09-16 02:00:01", result: "成功"},
    {id: 2, job: "清理过期日志", time: "2026-09-16 03:30:00", result: "成功"},
]);
</script>

<template>
  <div class="job-log-page">
    <h3>{{ $t("menu.joblog") }}</h3>
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
      <el-table-column prop="job" label="任务名称"/>
      <el-table-column prop="time" label="执行时间" width="180"/>
      <el-table-column prop="result" label="结果" width="120"/>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.job-log-page {
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
