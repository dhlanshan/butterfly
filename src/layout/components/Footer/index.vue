<script setup lang="ts">
const year = new Date().getFullYear();
const title = "JetBrains";
</script>

<template>
  <div class="b-footer">
    <span>Copyright © {{ year }} {{ title }}. All Rights Reserved.</span>
  </div>
</template>

<style scoped lang="scss">
.b-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
}
</style>
