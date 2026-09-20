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
        /* 深色侧栏：仅白天生效；夜模式跟 html.dark 变量，避免白壳/深色侧栏混用 */
        'is-navy': settingsStore.sidebarDark && !settingsStore.isDark,
      }"
      @transitionend="onAsideTransitionEnd"
  >
    <div class="aside">
      <Logo :class="{ dark: settingsStore.sidebarDark && !settingsStore.isDark }"/>
      <div class="layout_side">
        <Menu
            :route-tree="menuTree"
            :collapse="settingsStore.collapsed && !settingsStore.isMobile"
            :dark="settingsStore.sidebarDark && !settingsStore.isDark"
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
/* ==================== 侧边栏外层容器开始 ====================
 * 控制位置：template 中的 <aside class="aside-wrap">。
 * 这是侧边栏在整体布局里的占位层，负责宽度、背景、边框、折叠动画和移动端抽屉定位。
 *
 * 修改这里会影响：
 * - 桌面展开宽度 200px。
 * - 桌面折叠宽度 64px。
 * - 移动端收起时是否占位。
 * - 移动端展开时是否以抽屉覆盖主内容。
 * - 深色侧边栏的外层底色和右边线。
 */
.aside-wrap {
  /* 侧边栏高度始终占满整个浏览器视口 */
  height: 100vh;
  /* 浅色侧边栏默认背景，夜间模式下由 Element Plus 变量切换 */
  background: var(--el-bg-color);
  /* 侧边栏和右侧内容区之间的分隔线 */
  border-right: 1px solid var(--el-border-color);
  /* 侧边栏展开/折叠宽度动画；时长须与脚本 ASIDE_WIDTH_MS 一致 */
  transition: width 0.25s ease; /* 时长须与脚本 ASIDE_WIDTH_MS 一致 */
  /* 折叠、移动端隐藏时裁掉内部菜单内容，避免内容溢出到主区域 */
  overflow: hidden;
  /* 桌面默认展开宽度：正常侧边栏宽度 */
  width: 200px;

  /* ==================== 深色侧边栏外层配置开始 ====================
   * 启用条件：settingsStore.sidebarDark && !settingsStore.isDark。
   * 控制位置：侧边栏 aside-wrap 的背景和右边框。
   * 注意：菜单本体的深色背景、文字色、hover、选中态在 Menu/index.vue 的 .is-menu-dark 中配置。
   */
  &.is-navy {
    background: rgb(26, 31, 46);
    border-right-color: rgb(26, 31, 46);
  }
  /* ==================== 深色侧边栏外层配置结束 ==================== */

  /* ==================== 桌面折叠态开始 ====================
   * 启用条件：非移动端并且 settingsStore.collapsed 为 true。
   * 控制位置：桌面侧边栏宽度。
   * 菜单内部图标居中、文字隐藏和弹出层样式在 Menu/index.vue 中配置。
   */
  &.is-collapsed {
    width: 64px;
  }
  /* ==================== 桌面折叠态结束 ==================== */

  /* ==================== 移动端隐藏态开始 ====================
   * 启用条件：移动端并且 settingsStore.collapsed 为 true。
   * 控制位置：移动端抽屉关闭时的侧边栏占位。
   * 这里 width: 0 让主内容区占满全屏，border-right 去掉避免留一条线。
   */
  &.is-hidden {
    width: 0;
    border-right: none;
  }
  /* ==================== 移动端隐藏态结束 ==================== */

  /* ==================== 移动端抽屉展开态开始 ====================
   * 启用条件：移动端并且 settingsStore.collapsed 为 false。
   * 控制位置：移动端侧边栏以 fixed 抽屉方式覆盖页面左侧。
   * 修改这里会影响：抽屉宽度、层级、阴影和覆盖位置。
   */
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
  /* ==================== 移动端抽屉展开态结束 ==================== */
}
/* ==================== 侧边栏外层容器结束 ==================== */

/* ==================== 侧边栏内部纵向布局开始 ====================
 * 控制位置：aside-wrap 内部的 .aside，包含 Logo 和菜单区域。
 * 修改这里会影响：Logo 与菜单区域的上下排列，以及菜单区域是否能占满剩余高度。
 */
.aside {
  /* Logo 在上、菜单在下，纵向排列 */
  display: flex;
  flex-direction: column;
  /* 内部高度和外层侧边栏保持一致 */
  height: 100vh;
}
/* ==================== 侧边栏内部纵向布局结束 ==================== */

/* ==================== 侧边栏菜单区域开始 ====================
 * 控制位置：Logo 下方的 .layout_side，内部渲染 Menu/index.vue。
 * 修改这里会影响：菜单区域可用高度和菜单内容溢出方式。
 */
.layout_side {
  /* 占据 Logo 之外的全部剩余高度 */
  flex: 1;
  /* 裁掉菜单外溢内容；菜单自己的滚动在 Menu/index.vue 的 el-scrollbar 里处理 */
  overflow: hidden;
}
/* ==================== 侧边栏菜单区域结束 ==================== */

/* ==================== 移动端抽屉遮罩开始 ====================
 * 控制位置：移动端侧边栏展开时覆盖主内容的 .aside-mask。
 * 修改这里会影响：遮罩覆盖范围、遮罩颜色、遮罩层级。
 * 点击行为在 template 的 @click 中控制：点击遮罩会折叠侧边栏。
 */
.aside-mask {
  /* fixed 覆盖整个视口，不随内容滚动 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 1000;
}
/* ==================== 移动端抽屉遮罩结束 ==================== */
</style>
