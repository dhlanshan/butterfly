<script setup lang="ts">
/**
 * 顶部横向菜单（用于 top / mix 两种菜单布局模式）
 *
 * - top 模式：把完整路由树渲染为横向菜单，多级菜单通过 el-sub-menu 下拉展开，
 *   复用 MenuItem 递归组件即可（横向模式下 el-sub-menu 自动变成下拉）。
 * - mix 模式：顶部只渲染「顶层菜单项」：
 *     * 顶层叶子（type 2）→ el-menu-item，点击直达；
 *     * 顶层目录（type 1，无自身页面）→ el-menu-item，index 取其第一个叶子路径，
 *       点击跳到第一个真实页面，同时激活态用于驱动侧边栏切换子树。
 *
 * 通过 settingsStore.menuLayout 区分两种渲染方式。
 */
import MenuItem from "@/layout/components/Menu/menu-item.vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useMenuMethod} from "@/hooks/useMenuMethod.ts";
import {getFirstLeafPath, getActiveTopItem} from "@/hooks/useMenuLayout.ts";
import {useRoute} from "vue-router";

interface Props {
    routeTree: Menu.MenuOptions[];
}

const settingsStore = useSettingsStoreHook();
const {menuShow, aMenuShow} = useMenuMethod();
const route = useRoute();
const props = withDefaults(defineProps<Props>(), {
    routeTree: () => [],
});

// mix 模式下，顶层目录的 index 是其第一个叶子路径；
// 为了让「当前所属顶层项」高亮，需要把 default-active 映射到该顶层项的 index。
const mixActiveIndex = computed(() => {
    const top = getActiveTopItem(route.path, props.routeTree);
    if (!top) return route.path;
    return getFirstLeafPath(top);
});

// mix 模式下，顶层目录点击要跳转到的「第一个叶子路径」缓存
const firstLeafPath = (item: Menu.MenuOptions) => getFirstLeafPath(item);
</script>

<template>
  <!-- top 模式：完整路由树横向渲染，复用递归 MenuItem（横向 + 下拉） -->
  <el-menu
      v-if="settingsStore.menuLayout === 'top'"
      mode="horizontal"
      :router="true"
      :default-active="$route.path"
      :ellipsis="false"
      class="header-menu"
  >
    <MenuItem :route-tree="props.routeTree"/>
  </el-menu>

  <!-- mix 模式：顶部只渲染顶层项 -->
  <el-menu
      v-else
      mode="horizontal"
      :router="true"
      :default-active="mixActiveIndex"
      :ellipsis="false"
      class="header-menu"
  >
    <template v-for="item in props.routeTree" :key="item.path">
      <!-- 顶层叶子菜单：直接可点 -->
      <el-menu-item v-if="aMenuShow(item)" :index="item.path">
        {{ $t(`menu.${item.meta.title}`) }}
      </el-menu-item>
      <!-- 顶层目录：index 指向其第一个叶子，点击直达首个子页面 -->
      <el-menu-item v-else-if="menuShow(item)" :index="firstLeafPath(item)">
        {{ $t(`menu.${item.meta.title}`) }}
      </el-menu-item>
    </template>
  </el-menu>
</template>

<style scoped lang="scss">
/* 横向菜单：去掉 Element Plus 默认的底部多余间距，贴合 header 高度 */
.header-menu {
  flex: 1;
  height: 100%;
  border-bottom: none !important;
  background-color: transparent;
}
</style>
