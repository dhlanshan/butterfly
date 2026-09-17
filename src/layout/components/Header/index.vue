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
.header {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0;
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);

  /* top 模式下 Logo 区固定宽度，避免被横向菜单挤压 */
  .header-logo {
    flex-shrink: 0;
    width: 200px;
    height: 100%;
  }
}
</style>
