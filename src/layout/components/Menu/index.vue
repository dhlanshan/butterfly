<script setup lang="ts">
import MenuItem from './menu-item.vue'
import {useSettingsStoreHook} from "@/store/modules/settings.ts";

interface Props {
  routeTree: Menu.MenuOptions[];
  collapse?: boolean;
}

const settingsStore = useSettingsStoreHook();
const props = withDefaults(defineProps<Props>(), {
  routeTree: () => [],
  collapse: false
});
</script>

<template>
  <el-menu
      :router="true"
      :default-active="$route.path"
      :collapse="props.collapse"
      :collapse-transition="false"
      :unique-opened="settingsStore.menuAccordion"
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

/* 折叠时隐藏菜单文字，避免溢出 */
.el-menu--collapse {
  width: 64px;
}
</style>
