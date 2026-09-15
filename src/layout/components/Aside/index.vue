<script setup lang="ts">
/**
 * 侧边栏 Aside
 *
 * 根据菜单布局模式渲染不同的菜单树：
 * - side：渲染完整路由树（当前默认行为）。
 * - mix：只渲染「当前激活顶层项」的子菜单（getMixSubTree），顶部菜单负责切换顶层项。
 * - top：本组件不会被 defaultLayout 渲染（顶部模式无侧边栏）。
 *
 * 折叠 / 移动端抽屉逻辑保持不变：
 * - 桌面折叠：64px；桌面展开：200px。
 * - 移动端折叠：width 0；移动端展开：fixed 抽屉 + 遮罩。
 */
import Menu from "../Menu/index.vue"
import Logo from "../Logo/index.vue"
import {storeToRefs} from "pinia";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useRoute} from "vue-router";
import {getMixSubTree} from "@/hooks/useMenuLayout.ts";

const routerStore = useRouteConfigStoreHook();
const {routeTree} = storeToRefs(routerStore);
const settingsStore = useSettingsStoreHook();
const route = useRoute();

// mix 模式下侧边栏要渲染的子树（当前路由所属顶层项的 children）
const mixSubTree = computed(() => getMixSubTree(route.path, routeTree.value));

// 最终交给 Menu 的菜单树：
// - 移动端：所有模式统一用完整路由树（与 side 模式移动端体验一致）
// - mix 桌面端：只渲染当前激活顶层项的子菜单
// - side 桌面端：完整路由树
const menuTree = computed<Menu.MenuOptions[]>(() => {
    if (settingsStore.isMobile) return routeTree.value;
    if (settingsStore.menuLayout === "mix") return mixSubTree.value;
    return routeTree.value;
});

// 是否展示侧边栏：
// - 移动端：统一展示（抽屉模式，由汉堡按钮控制开合）
// - mix 桌面端：当前顶层项无子菜单时不展示
// - 其余情况展示
const showAside = computed(() => {
    if (settingsStore.isMobile) return true;
    if (settingsStore.menuLayout === "mix") return mixSubTree.value.length > 0;
    return true;
});

// 移动端抽屉模式下：路由切换（选中菜单）后自动折叠
watch(() => route.path, () => {
    if (settingsStore.isMobile && !settingsStore.collapsed) {
        settingsStore.isCollapse = true;
    }
});
</script>

<template>
  <!--
    桌面：正常文档流（200px / 64px）
    移动端折叠：width 0 隐藏不占位
    移动端展开：position fixed 抽屉覆盖内容
    mix 模式下当前顶层项无子菜单时整体不渲染
  -->
  <aside
      v-if="showAside"
      class="aside-wrap"
      :class="{
        'is-collapsed': !settingsStore.isMobile && settingsStore.collapsed,
        'is-hidden': settingsStore.isMobile && settingsStore.collapsed,
        'is-drawer': settingsStore.isMobile && !settingsStore.collapsed,
      }"
  >
    <div class="aside">
      <Logo/>
      <div class="layout_side">
        <Menu
            :route-tree="menuTree"
            :collapse="settingsStore.collapsed && !settingsStore.isMobile"
        />
      </div>
    </div>
  </aside>

  <!-- 移动端抽屉遮罩：点击折叠 -->
  <div
      v-if="settingsStore.isMobile && !settingsStore.collapsed && showAside"
      class="aside-mask"
      @click="settingsStore.isCollapse = true"
  ></div>
</template>

<style scoped lang="scss">
.aside-wrap {
  height: 100vh;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  transition: width 0.25s ease;
  overflow: hidden;
  /* 桌面默认展开：200px */
  width: 200px;

  /* 桌面折叠：64px（仅图标） */
  &.is-collapsed {
    width: 64px;
  }

  /* 移动端折叠：隐藏不占位，内容区占满宽度 */
  &.is-hidden {
    width: 0;
    border-right: none;
  }

  /* 移动端展开：抽屉模式，悬浮覆盖内容 */
  &.is-drawer {
    position: fixed;
    top: 0;
    left: 0;
    width: 200px;
    height: 100vh;
    z-index: 1001;
    border-right: none;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
}

.aside {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.layout_side {
  flex: 1;
  overflow: hidden;
}

/* 移动端抽屉遮罩 */
.aside-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 1000;
}
</style>
