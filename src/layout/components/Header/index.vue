<script setup lang="ts">
import HeaderLeft from "./components/header-left/index.vue";
import HeaderRight from "./components/header-right/index.vue";
</script>

<template>
  <el-header class="header">
    <HeaderLeft/>
    <HeaderRight/>
  </el-header>
</template>

<style scoped lang="scss">
.header {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0;
  border-bottom: 1px solid #f0f0f0;
  background-color: var(--el-bg-color);
}
</style>
