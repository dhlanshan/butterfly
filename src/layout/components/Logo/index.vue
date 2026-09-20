<script setup lang="ts">
import LogoSvg from "@/components/b-logo/index.vue";

const bannerTitle = "JetBrains"
</script>

<template>
  <div class="logo_head">
    <div class="logo_box">
      <LogoSvg :width="32" :height="32" />
      <span class="logo_title">{{ bannerTitle }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ==================== 侧边栏 Logo 区域开始 ====================
 * 控制位置：侧边栏顶部的 .logo_head，内部包含产品 Logo 图标和标题文字。
 * 修改这里会影响：Logo 区域高度、图标/标题的对齐方式、侧边栏顶部占位。
 */
.logo_head {
  /* 让 padding、border 都计入 60px 高度内 */
  box-sizing: border-box;
  /* Logo 图标和标题使用 flex 对齐 */
  display: flex;
  /* 垂直居中 Logo 行 */
  align-items: center;
  /* 默认让内部内容在横向有均衡留白 */
  justify-content: space-around;
  /* Logo 区域固定高度，需要和 Header 高度保持视觉一致 */
  height: 60px;


  /* ==================== Logo 内容行开始 ====================
   * 控制位置：.logo_head 内部的 .logo_box，包住 LogoSvg 和标题文字。
   * 修改这里会影响：Logo 与标题的横向排列、左右内边距、折叠时内容裁剪。
   */
  .logo_box {
    /* 图标和标题横向排列 */
    display: flex;
    // column-gap: $padding;
    /* 图标和标题垂直居中 */
    align-items: center;
    /* 内容行占满 Logo 区域宽度 */
    width: 100%;
    /* Logo 行左右留白；折叠态如需居中可配合 .padding-unset */
    padding: 0 16px;
    /* 折叠或宽度不足时裁掉标题溢出，避免挤到菜单区 */
    overflow: hidden;
  }
  /* ==================== Logo 内容行结束 ==================== */

  /* ==================== Logo 去内边距状态开始 ====================
   * 控制位置：需要让 Logo 居中显示的场景，例如折叠侧边栏或横向布局复用时。
   * 当前文件没有主动绑定该 class，保留给外部状态或后续扩展使用。
   */
  .padding-unset {
    justify-content: space-around;
    padding: unset;
  }
  /* ==================== Logo 去内边距状态结束 ==================== */

  /* ==================== Logo 标题文字开始 ====================
   * 控制位置：Logo 图标右侧的产品标题 .logo_title。
   * 修改这里会影响：标题宽度、字号、粗细、颜色和超出省略。
   */
  .logo_title {
    /* 让标题自身尺寸计算包含 padding/border */
    box-sizing: border-box;
    /* 标题最大宽度，防止长标题撑宽侧边栏 */
    max-width: 140px;
    /* 超出最大宽度时隐藏 */
    overflow: hidden;
    /* 超出部分显示省略号 */
    text-overflow: ellipsis;
    /* 标题字号 */
    font-size: 16px;
    /* 标题加粗 */
    font-weight: bold;
    /* 标题文字左对齐 */
    text-align: left;
    /* 禁止标题换行，配合省略号 */
    white-space: nowrap;
    /* 浅色/夜间模式默认标题颜色，跟随 Element Plus 文本变量 */
    color: var(--el-text-color-primary);
  }
  /* ==================== Logo 标题文字结束 ==================== */

  /* ==================== 深色侧边栏 Logo 标题开始 ====================
   * 控制位置：外部给 Logo 组件根节点 .logo_head 加 .dark class 时的标题颜色。
   * 启用来源：Aside/index.vue 中 sidebarDark && !isDark 时传入。
   */
  &.dark .logo_title {
    color: #bfcbd9;
  }
  /* ==================== 深色侧边栏 Logo 标题结束 ==================== */
}
/* ==================== 侧边栏 Logo 区域结束 ==================== */

/* ==================== Logo 无边框辅助类开始 ====================
 * 控制位置：给 Logo 根区域或相关容器加 .no-border 时去掉边框。
 * 当前文件模板没有直接使用，属于可复用的辅助样式。
 */
.no-border {
  border: unset;
}
/* ==================== Logo 无边框辅助类结束 ==================== */
</style>
