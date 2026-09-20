<script setup lang="ts">
/**
 * 顶部 Header
 * - 始终包含左侧（折叠按钮 + 面包屑）和右侧（操作区 + 用户）。
 * - 菜单布局为 top / mix 时，额外在中间渲染横向菜单 HeaderMenu。
 * - top 模式下没有侧边栏 Logo，因此在左侧补一个 Logo。
 */
import HeaderLeft from "./components/header-left/index.vue";
import HeaderRight from "./components/header-right/index.vue";
import HeaderMenu from "./components/header-menu/index.vue";
import Logo from "../Logo/index.vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {storeToRefs} from "pinia";

const settingsStore = useSettingsStoreHook();
const routerStore = useRouteConfigStoreHook();
const {routeTree} = storeToRefs(routerStore);
</script>

<template>
  <el-header class="header">
    <!-- top 模式：左侧放 Logo（此模式无侧边栏 Logo）；移动端 Logo 进抽屉，不在 header 展示 -->
    <Logo v-if="settingsStore.menuLayout === 'top' && !settingsStore.isMobile" class="header-logo"/>
    <!-- 左侧：折叠按钮 + 面包屑 -->
    <HeaderLeft/>
    <!-- top / mix 模式：中间横向菜单（移动端隐藏，改用抽屉式侧边栏） -->
    <HeaderMenu
        v-if="(settingsStore.menuLayout === 'top' || settingsStore.menuLayout === 'mix') && !settingsStore.isMobile"
        :route-tree="routeTree"
    />
    <!-- 右侧：操作区 + 用户 -->
    <HeaderRight/>
  </el-header>
</template>

<style scoped lang="scss">
/* ==================== 顶部 Header 容器开始 ====================
 * 控制位置：右侧顶部的 <el-header class="header">。
 * 内部包含：top 模式 Logo、左侧折叠/面包屑、中间横向菜单、右侧操作区。
 * 修改这里会影响：Header 高度、横向排列方式、底部分隔线和背景色。
 */
.header {
  /* 给内部绝对定位或弹层锚点预留定位上下文 */
  position: relative;
  /* padding、border 计入 60px 高度内 */
  box-sizing: border-box;
  /* Header 内部元素横向排列 */
  display: flex;
  /* Header 内部元素垂直居中 */
  align-items: center;
  /* Header 固定高度，需要和侧边栏 Logo 高度保持一致 */
  height: 60px;
  /* 去掉 el-header 默认左右 padding，让子组件自己控制间距 */
  padding: 0;
  /* Header 与 Tabs/Main 之间的底部分隔线 */
  border-bottom: 1px solid var(--el-border-color);
  /* Header 背景色，跟随浅色/夜间模式 */
  background-color: var(--el-bg-color);

  /* ==================== top 模式 Header Logo 开始 ====================
   * 控制位置：menuLayout 为 top 时，Header 左侧显示的 Logo 组件。
   * 修改这里会影响：顶部模式下 Logo 区宽度，以及横向菜单从哪里开始排列。
   */
  .header-logo {
    /* 不允许 Logo 被横向菜单挤压变窄 */
    flex-shrink: 0;
    /* Logo 区宽度与侧边栏展开宽度保持一致 */
    width: 200px;
    /* Logo 组件撑满 Header 高度 */
    height: 100%;
  }
  /* ==================== top 模式 Header Logo 结束 ==================== */
}
/* ==================== 顶部 Header 容器结束 ==================== */
</style>
