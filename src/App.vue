<script setup lang="ts">
/**
 * 去掉全量 app.use(ElementPlus) 后，内部文案（弹窗按钮等）需自行提供 locale。
 * el-config-provider 本身也走按需 Resolver。
 */
import zhCn from "element-plus/es/locale/lang/zh-cn";
</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView/>
  </el-config-provider>
</template>
