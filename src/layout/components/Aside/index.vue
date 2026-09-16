<script setup lang="ts">
/**
 * 侧边栏 Aside
 *
 * 根据菜单布局模式渲染不同的菜单树：
 * - side：渲染完整路由树（当前默认行为）。
 * - mix：当前激活顶层项的子菜单；若顶层是叶子（无 children）则回显该项本身。
 *   桌面→移动收起时先保持该子树，宽度动画结束后再换成整棵树（见 useFullTree）。
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
import {getMixSubTree, hasMixSidebar} from "@/hooks/useMenuLayout.ts";

const routerStore = useRouteConfigStoreHook();
const {routeTree} = storeToRefs(routerStore);
const settingsStore = useSettingsStoreHook();
const route = useRoute();

// mix 模式下侧边栏要渲染的子树（顶层目录的 children，或顶层叶子自身）
const mixSubTree = computed(() => getMixSubTree(route.path, routeTree.value));

/**
 * mix 桌面→移动：不要在宽度收起动画期间把菜单换成整棵树，否则会「先闪出全部菜单再收齐」。
 * useFullTree=false 时仍用 mix 子树；动画结束（或抽屉要展开）后再切整棵树。
 * 与 CSS `transition: width 0.25s` 对齐；transitionend 为主、超时兜底（防 transitionend 不触发）。
 * 仅在跨越移动端阈值时跑一次，不是每次 resize / 每次导航。
 */
const ASIDE_WIDTH_MS = 250;
const useFullTree = ref(settingsStore.isMobile);
let treeSwapTimer: ReturnType<typeof setTimeout> | null = null;

const clearTreeSwapTimer = () => {
    if (!treeSwapTimer) return;
    clearTimeout(treeSwapTimer);
    treeSwapTimer = null;
};

const commitFullTree = () => {
    clearTreeSwapTimer();
    useFullTree.value = true;
};

watch(
    () => settingsStore.isMobile,
    (mobile) => {
        if (!mobile) {
            // 移动→桌面：立刻切回 mix 子树，展开动画里就是当前项
            clearTreeSwapTimer();
            useFullTree.value = false;
            return;
        }
        if (settingsStore.menuLayout !== "mix") {
            useFullTree.value = true;
            return;
        }
        // mix 桌面→移动：延迟到宽度收起完成再换整棵树
        clearTreeSwapTimer();
        treeSwapTimer = setTimeout(commitFullTree, ASIDE_WIDTH_MS);
    }
);

/** 宽度过渡结束且仍处于待切换状态时提交；忽略子元素冒泡和 height 等其它属性 */
const onAsideTransitionEnd = (e: TransitionEvent) => {
    if (e.target !== e.currentTarget || e.propertyName !== "width") return;
    if (settingsStore.isMobile && !useFullTree.value) commitFullTree();
};

/** 抽屉要展开时不能再等动画：必须立刻换成整棵树，否则汉堡打开还是子树 */
watch(
    () => settingsStore.collapsed,
    (collapsed) => {
        if (settingsStore.isMobile && !collapsed && !useFullTree.value) {
            commitFullTree();
        }
    }
);

onUnmounted(clearTreeSwapTimer);

// 最终交给 Menu 的菜单树：
// - mix 且尚未切到全量（桌面，或桌面→移动的收起动画中）：当前顶层子树
// - 其余（side / 移动端抽屉就绪）：完整路由树
const menuTree = computed<Menu.MenuOptions[]>(() => {
    if (settingsStore.menuLayout === "mix" && !useFullTree.value) return mixSubTree.value;
    return routeTree.value;
});

// 是否展示侧边栏：
// - 移动端：统一展示（抽屉模式，由汉堡按钮控制开合）
// - mix 桌面端：命中顶层项即展示（目录用 children，叶子回显自身）
// - 其余情况展示
const showAside = computed(() => {
    if (settingsStore.isMobile) return true;
    if (settingsStore.menuLayout === "mix") return hasMixSidebar(route.path, routeTree.value);
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
    mix 模式下当前顶层项未命中时不渲染
  -->
  <aside
      v-if="showAside"
      class="aside-wrap"
      :class="{
        'is-collapsed': !settingsStore.isMobile && settingsStore.collapsed,
        'is-hidden': settingsStore.isMobile && settingsStore.collapsed,
        'is-drawer': settingsStore.isMobile && !settingsStore.collapsed,
        'is-dark': settingsStore.sidebarDark,
      }"
      @transitionend="onAsideTransitionEnd"
  >
    <div class="aside">
      <Logo :class="{ dark: settingsStore.sidebarDark }"/>
      <div class="layout_side">
        <Menu
            :route-tree="menuTree"
            :collapse="settingsStore.collapsed && !settingsStore.isMobile"
            :dark="settingsStore.sidebarDark"
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
  transition: width 0.25s ease; /* 时长须与脚本 ASIDE_WIDTH_MS 一致 */
  overflow: hidden;
  /* 桌面默认展开：200px */
  width: 200px;

  /* 侧边栏深色模式：深蓝底（若依风 #304156） + 浅色文字 */
  &.is-dark {
    background: #304156;
    border-right-color: #1f2d3d;
  }

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
