<script setup lang="ts">

</script>

<template>
  <el-main class="main">
    <RouterView></RouterView>
  </el-main>
</template>

<style scoped lang="scss">
.main {
  flex: 1;
  height: 0;
  overflow: auto;
  background-color: var(--el-bg-color-page);
}
</style>
