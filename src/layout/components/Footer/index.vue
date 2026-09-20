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
/* ==================== 页面底部版权栏开始 ====================
 * 控制位置：右侧内容区底部的 <div class="b-footer">。
 * 修改这里会影响：Footer 高度、文字居中方式、字号、颜色、顶部边框和背景色。
 * 显示/隐藏由 defaultLayout 中 settingsStore.showFooter 控制。
 */
.b-footer {
  /* 使用 flex 让版权文字水平、垂直居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* Footer 固定高度，会参与 Main 剩余高度计算 */
  height: 40px;
  /* 版权文字字号 */
  font-size: 12px;
  /* 版权文字使用次级文本色，跟随浅色/夜间主题 */
  color: var(--el-text-color-secondary);
  /* Footer 和 Main 内容区之间的顶部边线 */
  border-top: 1px solid var(--el-border-color);
  /* Footer 背景，跟随浅色/夜间主题 */
  background-color: var(--el-bg-color);
}
/* ==================== 页面底部版权栏结束 ==================== */
</style>
