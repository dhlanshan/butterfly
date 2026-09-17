<script setup lang="ts">
import MenuItem from './menu-item.vue'
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useRoutingMethod} from "@/hooks/useRoutingMethod.ts";

interface Props {
  routeTree: Menu.MenuOptions[];
  collapse?: boolean;
  /** 深色侧边栏：开启时菜单使用深色背景 + 浅色文字（配合 sidebarDark 设置） */
  dark?: boolean;
}

const settingsStore = useSettingsStoreHook();
// 菜单点击分流（纯外链 window.open / iframe与内部页 router.push），替代 :router=true 自动导航
const {handleMenuSelect} = useRoutingMethod();
const props = withDefaults(defineProps<Props>(), {
  routeTree: () => [],
  collapse: false,
  dark: false
});

// 深色模式下的菜单配色（若依风：深蓝底 + 浅灰文字 + 选中蓝字）
const darkColors = {
  background: "#304156",
  textColor: "#bfcbd9",
  activeTextColor: "#409eff",
};
</script>

<template>
  <el-menu
      :default-active="$route.path"
      :collapse="props.collapse"
      :collapse-transition="false"
      :unique-opened="settingsStore.menuAccordion"
      :class="{ 'is-menu-dark': props.dark, 'is-menu-night': settingsStore.isDark }"
      :background-color="props.dark ? darkColors.background : undefined"
      :text-color="props.dark ? darkColors.textColor : undefined"
      :active-text-color="props.dark ? darkColors.activeTextColor : undefined"
      @select="handleMenuSelect"
  >
    <MenuItem :route-tree="props.routeTree" />
  </el-menu>
</template>

<style scoped lang="scss">
.el-menu {
  border: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: transparent;
}

/* 菜单项与子菜单标题：日/夜同一套盒模型，避免切主题时左右错位 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
  margin: 4px 8px;
  width: calc(100% - 16px);
  border-radius: 6px;
}

/* 图标与文字对齐：折叠态依赖 .el-icon 作为唯一可见图标位 */
:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  width: 18px;
  font-size: 16px;
  margin-right: 8px;
}

/* 折叠时隐藏菜单文字，避免溢出 */
.el-menu--collapse {
  width: 64px;
}

/* 深色模式下，子菜单弹出层（teleport 到 body）也需要深色背景 */
:deep(.el-sub-menu__title:hover) {
  background-color: transparent;
}

/*
 * 深色侧边栏（若依风）选中态与悬停态：
 * - 选中项：浅蓝文字 + 右侧 3px 蓝色竖条 + 略浅深蓝底
 * - 悬停项：略浅深蓝底
 * 注意：el-menu-item 选中文字色由 active-text-color 控制，
 *   右侧竖条与背景在这里用 :deep 覆盖。
 */
.is-menu-dark {
  :deep(.el-menu-item.is-active) {
    background-color: #263445 !important;
    border-right: 3px solid #409eff;
  }
  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    background-color: #263445 !important;
  }
}

/* 夜模式只改选中/悬停色，不再改 margin/width */
.is-menu-night {
  :deep(.el-menu-item.is-active) {
    background-color: var(--el-color-primary) !important;
    color: #fff !important;
  }

  :deep(.el-menu-item:not(.is-active):hover),
  :deep(.el-sub-menu__title:hover) {
    background-color: var(--el-fill-color-light) !important;
  }
}
</style>
