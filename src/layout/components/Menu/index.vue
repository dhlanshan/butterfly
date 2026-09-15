<script setup lang="ts">
import MenuItem from './menu-item.vue'
import {useSettingsStoreHook} from "@/store/modules/settings.ts";

interface Props {
  routeTree: Menu.MenuOptions[];
  collapse?: boolean;
  /** 深色侧边栏：开启时菜单使用深色背景 + 浅色文字（配合 sidebarDark 设置） */
  dark?: boolean;
}

const settingsStore = useSettingsStoreHook();
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
      :router="true"
      :default-active="$route.path"
      :collapse="props.collapse"
      :collapse-transition="false"
      :unique-opened="settingsStore.menuAccordion"
      :class="{ 'is-menu-dark': props.dark }"
      :background-color="props.dark ? darkColors.background : undefined"
      :text-color="props.dark ? darkColors.textColor : undefined"
      :active-text-color="props.dark ? darkColors.activeTextColor : undefined"
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
}

/* 菜单项与子菜单标题高度统一为 44px */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
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
</style>
