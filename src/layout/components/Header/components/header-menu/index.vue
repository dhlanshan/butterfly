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
import MenuIcon from "@/layout/components/Menu/menu-icon.vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useMenuMethod} from "@/hooks/useMenuMethod.ts";
import {getFirstLeafPath, getActiveTopItem} from "@/hooks/useMenuLayout.ts";
import {useRoutingMethod} from "@/hooks/useRoutingMethod.ts";
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

// 菜单点击分流（纯外链 window.open / iframe与内部页 router.push），替代 :router=true 自动导航
const {handleMenuSelect} = useRoutingMethod();
</script>

<template>
  <!-- top 模式：完整路由树横向渲染，复用递归 MenuItem（横向 + 下拉） -->
  <el-menu
      v-if="settingsStore.menuLayout === 'top'"
      mode="horizontal"
      :default-active="$route.path"
      :ellipsis="false"
      class="header-menu"
      @select="handleMenuSelect"
  >
    <MenuItem :route-tree="props.routeTree"/>
  </el-menu>

  <!-- mix 模式：顶部只渲染顶层项 -->
  <el-menu
      v-else
      mode="horizontal"
      :default-active="mixActiveIndex"
      :ellipsis="false"
      class="header-menu"
      @select="handleMenuSelect"
  >
    <template v-for="item in props.routeTree" :key="item.path">
      <!-- 顶层叶子菜单：直接可点 -->
      <el-menu-item v-if="aMenuShow(item)" :index="item.path">
        <MenuIcon :svg-icon="item.meta.svgIcon" :icon="item.meta.icon" />
        <span>{{ $t(`menu.${item.meta.title}`) }}</span>
      </el-menu-item>
      <!-- 顶层目录：index 指向其第一个叶子，点击直达首个子页面 -->
      <el-menu-item v-else-if="menuShow(item)" :index="firstLeafPath(item)">
        <MenuIcon :svg-icon="item.meta.svgIcon" :icon="item.meta.icon" />
        <span>{{ $t(`menu.${item.meta.title}`) }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<style scoped lang="scss">
/* ==================== Header 横向菜单开始 ====================
 * 控制位置：Header 中间的横向 el-menu，用于 top / mix 两种菜单布局。
 * top 模式：渲染完整路由树。
 * mix 模式：只渲染顶层菜单项。
 * 修改这里会影响：横向菜单占位宽度、高度、背景、底部边框和图标间距。
 */
.header-menu {
  /* 占据 Header 中间剩余空间，左右分别让给 HeaderLeft / HeaderRight */
  flex: 1;
  /* 高度贴合 Header 60px */
  height: 100%;
  /* 去掉 Element Plus horizontal menu 默认底部边框，避免和 Header 边框重叠 */
  border-bottom: none !important;
  /* 背景透明，使用 Header 的背景色 */
  background-color: transparent;

  /* 横向菜单图标：控制图标和文字之间的距离，视觉上接近侧边菜单 */
  :deep(.el-menu-item .el-icon) {
    margin-right: 6px;
  }
}
/* ==================== Header 横向菜单结束 ==================== */
</style>
