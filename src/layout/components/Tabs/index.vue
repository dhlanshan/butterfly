<script setup lang="ts">
import {useRouter, useRoute} from "vue-router";
import {
    Refresh, Menu as IconMenu, Close, Back, Right, Switch as IconSwitch, Minus, FullScreen, Aim,
    ArrowLeft, ArrowRight,
} from "@element-plus/icons-vue";
import {useTabsStoreHook} from "@/store/modules/tabs.ts";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {storeToRefs} from "pinia";
import {findCategoryById} from "@/utils/other.ts";

const router = useRouter();
const route = useRoute();
const tabsStore = useTabsStoreHook();
const settingsStore = useSettingsStoreHook();
const {tabs, activePath} = storeToRefs(tabsStore);
const routeStore = useRouteConfigStoreHook();
const {routeTree} = storeToRefs(routeStore);

/* ---------- 监听路由变化，自动添加标签开始 ----------
 * 控制位置：路由切换后自动维护顶部 Tabs。
 * 排除登录页和错误页，避免这些特殊页面出现在标签栏。
 * immediate: true 用于首次进入系统时立刻把当前路由加入标签。
 * ---------- 监听路由变化，自动添加标签结束 ---------- */
watch(
    () => route.path,
    () => {
        if (route.path === "/login" || route.path.startsWith("/401") ||
            route.path.startsWith("/404") || route.path.startsWith("/500")) {
            return;
        }
        tabsStore.addTab(route);
    },
    {immediate: true}
);

/* ---------- 持久化标签 meta 校正开始 ----------
 * 控制位置：刷新页面后从持久化恢复出来的 tabs。
 * 路由配置变更（例如改 affix / title）后，旧标签需要按最新 routeTree 批量刷新 meta 快照。
 * immediate: 处理 Tabs 挂载时 routeTree 已经构建好的情况。
 * deep: false：routeTree 是整体重新赋值，引用变化即可触发，避免大树深比较开销。
 * ---------- 持久化标签 meta 校正结束 ---------- */
watch(
    routeTree,
    (tree) => tabsStore.reconcileWithRouteTree(tree),
    {immediate: true, deep: false}
);

/* ---------- 点击标签跳转开始 ----------
 * 控制位置：点击单个 tab-item 时的路由切换。
 * 拖拽结束后浏览器可能补发一次 click，这里用 skipTabClick / skipTabPath 吞掉拖拽残留点击。
 * ---------- 点击标签跳转结束 ---------- */
const handleClick = (tab: any) => {
    // 只吞紧跟拖拽、点在被拖项上的 click（松手残留）；点别的标签要立刻能切
    if (skipTabClick) {
        const swallow = tab.path === skipTabPath;
        skipTabClick = false;
        skipTabPath = "";
        if (swallow) return;
    }
    if (route.path !== tab.path) {
        router.push(tab.fullPath || tab.path);
    }
};

/* ---------- 页签拖拽换位开始 ----------
 * 启用条件：settingsStore.tabDrag 为 true。
 * 控制位置：标签栏里 tab-item 的 HTML5 drag 行为。
 * 换位规则：被拖标签相对“当前槽位”移动超过自身一半宽度，就和相邻项换位。
 * 换位后把 slotOriginLeft 更新到新槽位，允许一次拖拽连续跨多个标签。
 * ---------- 页签拖拽换位结束 ---------- */
const dragFrom = ref(-1);
// 松手后 :hover 还停在旧槽位；先把悬停钉在落下的标签上，指针真正移动后再交给原生 hover
const dropHoverIndex = ref(-1);
let skipTabClick = false;
let skipTabPath = "";
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragWidth = 0;
let dragHeight = 0;
let slotOriginLeft = 0;
let lastDragX = 0;
let lastDragY = 0;
let onDropHoverPointerMove: ((e: PointerEvent) => void) | null = null;

const barRef = ref<HTMLElement | null>(null);

const stopDropHoverWatch = () => {
    if (!onDropHoverPointerMove) return;
    window.removeEventListener("pointermove", onDropHoverPointerMove);
    onDropHoverPointerMove = null;
};

const stopWinDragOver = () => {
    window.removeEventListener("dragover", onWinDragOver);
};

const onTabDragStart = (index: number, e: DragEvent) => {
    stopDropHoverWatch();
    dropHoverIndex.value = -1;
    dragFrom.value = index;
    skipTabClick = true;
    skipTabPath = tabs.value[index]?.path ?? "";
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    dragWidth = rect.width || 80;
    dragHeight = rect.height || 40;
    slotOriginLeft = rect.left;
    window.addEventListener("dragover", onWinDragOver);
    const dt = e.dataTransfer;
    if (!dt) return;
    dt.effectAllowed = "move";
    dt.setData("text/plain", String(index));
};

const onTabsDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
};

// 挂在 window：光标离开栏时 dragover 还在；上下重叠或距栏 5px 内仍按半宽换位
const onWinDragOver = (e: DragEvent) => {
    if (dragFrom.value < 0) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    const barEl = barRef.value;
    const scrollEl = scrollRef.value;
    if (!barEl || !scrollEl) return;
    const bar = barEl.getBoundingClientRect();
    const ghostTop = e.clientY - dragOffsetY;
    const ghostBottom = ghostTop + dragHeight;
    const slack = 5;
    if (ghostBottom < bar.top - slack || ghostTop > bar.bottom + slack) return;
    const from = dragFrom.value;
    const ghostLeft = e.clientX - dragOffsetX;
    const delta = ghostLeft - slotOriginLeft;
    const half = dragWidth / 2;
    const items = scrollEl.querySelectorAll(".tab-item");
    if (delta > half && from < items.length - 1) {
        const to = from + 1;
        slotOriginLeft = items[to].getBoundingClientRect().left;
        tabsStore.moveTab(from, to);
        dragFrom.value = to;
    } else if (delta < -half && from > 0) {
        const to = from - 1;
        slotOriginLeft = items[to].getBoundingClientRect().left;
        tabsStore.moveTab(from, to);
        dragFrom.value = to;
    }
};

const onTabDragEnd = () => {
    stopWinDragOver();
    const dropped = dragFrom.value;
    dragFrom.value = -1;
    // 拖完常常没有 click，下一轮事件就把标记清掉，避免下一次点标签被误吞
    window.setTimeout(() => {
        skipTabClick = false;
        skipTabPath = "";
    }, 0);
    if (dropped < 0) return;
    dropHoverIndex.value = dropped;
    stopDropHoverWatch();
    onDropHoverPointerMove = (e: PointerEvent) => {
        if (Math.abs(e.clientX - lastDragX) < 3 && Math.abs(e.clientY - lastDragY) < 3) return;
        dropHoverIndex.value = -1;
        stopDropHoverWatch();
    };
    window.addEventListener("pointermove", onDropHoverPointerMove);
};

/* ---------- 关闭单个标签开始 ----------
 * 控制位置：tab-item 右侧关闭按钮。
 * closeTab 返回下一个应跳转的路径；如果关闭的是当前页，就跳到 store 给出的相邻页。
 * ---------- 关闭单个标签结束 ---------- */
const handleClose = (path: string, e: MouseEvent) => {
    e.stopPropagation();
    const next = tabsStore.closeTab(path);
    if (next) router.push(next);
};

/* ---------- 刷新当前页开始 ----------
 * 控制位置：标签栏右侧刷新按钮、操作菜单 reload 项。
 * 通过递增 routeReloadKey 让 Main 里的 :key 变化，强制当前路由组件重挂载。
 * 不依赖额外 /redirect 路由，避免跳到不存在路由导致空白。
 * ---------- 刷新当前页结束 ---------- */
const handleRefresh = () => {
    settingsStore.reloadCurrentRoute();
};

/* ---------- 内容区全屏开始 ----------
 * 控制位置：标签操作菜单里的“内容区全屏”。
 * 在 html 上切换 content-fullscreen class，由全局 CSS 隐藏侧边栏/Header。
 * 标签栏保留，主内容区铺满剩余空间；再次点击退出。
 * ---------- 内容区全屏结束 ---------- */
const isContentFullscreen = ref(false);
const toggleContentFullscreen = () => {
    isContentFullscreen.value = !isContentFullscreen.value;
    document.documentElement.classList.toggle("content-fullscreen", isContentFullscreen.value);
};

/* ---------- 标签操作菜单开始 ----------
 * 控制位置：右侧“更多”下拉菜单，以及单个标签右键菜单。
 * opsMenuPath 表示当前菜单针对哪个标签；为空时默认针对 activePath。
 * ctxVisible / ctxPos / ctxMenuRef 控制右键菜单的显示、位置和边界修正。
 * ---------- 标签操作菜单结束 ---------- */
const opsMenuPath = ref<string | null>(null);
const ctxVisible = ref(false);
const ctxPos = ref({x: 0, y: 0});
const ctxMenuRef = ref<HTMLElement | null>(null);
const tabOpsRef = ref<{ handleClose: () => void } | null>(null);

const menuPath = computed(() => opsMenuPath.value || activePath.value);
const menuIdx = computed(() => tabs.value.findIndex(t => t.path === menuPath.value));
const canReload = computed(() => menuPath.value === activePath.value);

const closeCtxMenu = () => {
    ctxVisible.value = false;
};

const onTabContextMenu = (e: MouseEvent, tab: { path: string }) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragFrom.value >= 0) return;
    tabOpsRef.value?.handleClose();
    opsMenuPath.value = tab.path;
    ctxPos.value = {x: e.clientX, y: e.clientY};
    ctxVisible.value = true;
    nextTick(() => {
        const menu = ctxMenuRef.value;
        if (!menu) return;
        const r = menu.getBoundingClientRect();
        let {x, y} = ctxPos.value;
        if (x + r.width > window.innerWidth - 4) x = window.innerWidth - r.width - 4;
        if (y + r.height > window.innerHeight - 4) y = window.innerHeight - r.height - 4;
        ctxPos.value = {x: Math.max(4, x), y: Math.max(4, y)};
    });
};

/** 右键不启动 HTML5 拖拽，避免拖动手势抢走 contextmenu */
const onTabMouseDown = (e: MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.draggable = settingsStore.tabDrag && e.button === 0;
};

const onOpsBtnClick = () => {
    closeCtxMenu();
    opsMenuPath.value = activePath.value;
};

const onOpsVisible = (vis: boolean) => {
    // 右键已把目标写成非当前标签后，汉堡关闭回调会晚到；此时不能清，否则刷新又变成可用
    if (!vis && !ctxVisible.value) opsMenuPath.value = null;
};

const onCtxItem = (cmd: string, disabled: boolean) => {
    if (disabled) return;
    closeCtxMenu();
    handleCommand(cmd);
};

const onWinMouseDown = (e: MouseEvent) => {
    if (!ctxVisible.value) return;
    if (ctxMenuRef.value?.contains(e.target as Node)) return;
    closeCtxMenu();
};

const onWinKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeCtxMenu();
};

const handleCommand = (cmd: string) => {
    const path = opsMenuPath.value || activePath.value;
    let next: string | null = null;
    switch (cmd) {
        case "reload":
            if (path !== activePath.value) return;
            handleRefresh();
            return;
        case "close-current":
            next = tabsStore.closeTab(path);
            break;
        case "close-left-side":
            tabsStore.closeLeft(path);
            if (!tabs.value.some(t => t.path === route.path)) next = path;
            break;
        case "close-right-side":
            tabsStore.closeRight(path);
            if (!tabs.value.some(t => t.path === route.path)) next = path;
            break;
        case "close-other":
            tabsStore.closeOther(path);
            if (route.path !== path) next = path;
            break;
        case "close-all":
            next = tabsStore.closeAll();
            break;
        case "content-fullscreen":
            toggleContentFullscreen();
            return;
    }
    if (next) router.push(next);
};

/* ---------- 标签操作可用性开始 ----------
 * 控制位置：更多菜单和右键菜单中每一项是否 disabled。
 * 判断基准是 menuPath，也就是“当前菜单针对的标签”，不一定是当前激活标签。
 * affix 标签不可关闭，因此关闭相关操作都会排除 affix。
 * ---------- 标签操作可用性结束 ---------- */
const canCloseCurrent = computed(() => {
    const t = tabs.value[menuIdx.value];
    return !!t && !t.affix;
});
const canCloseLeft = computed(() =>
    tabs.value.some((t, i) => i < menuIdx.value && !t.affix)
);
const canCloseRight = computed(() =>
    tabs.value.some((t, i) => i > menuIdx.value && !t.affix)
);
const canCloseOther = computed(() =>
    tabs.value.some(t => !t.affix && t.path !== menuPath.value)
);
const canCloseAll = computed(() => tabs.value.some(t => !t.affix));

const opsItems = computed(() => [
    {cmd: "reload", icon: Refresh, labelKey: "system.reload", disabled: !canReload.value, divided: false},
    {cmd: "close-current", icon: Close, labelKey: "system.close-current-tab", disabled: !canCloseCurrent.value, divided: true},
    {cmd: "close-left-side", icon: Back, labelKey: "system.close-left-tab", disabled: !canCloseLeft.value, divided: false},
    {cmd: "close-right-side", icon: Right, labelKey: "system.close-right-tab", disabled: !canCloseRight.value, divided: true},
    {cmd: "close-other", icon: IconSwitch, labelKey: "system.close-other-tab", disabled: !canCloseOther.value, divided: false},
    {cmd: "close-all", icon: Minus, labelKey: "system.close-all-tab", disabled: !canCloseAll.value, divided: true},
    {
        cmd: "content-fullscreen",
        icon: isContentFullscreen.value ? Aim : FullScreen,
        labelKey: isContentFullscreen.value ? "system.exit-content-fullscreen" : "system.content-fullscreen",
        disabled: false,
        divided: true,
    },
]);

/* ---------- 标签标题解析开始 ----------
 * 控制位置：tab-item 内展示的标题。
 * 优先从最新 routeTree 查 meta.title，找不到时回退到 tab 快照里的 title。
 * ---------- 标签标题解析结束 ---------- */
const getTitle = (tab: any) => {
    const node = findCategoryById(routeTree.value, "path", tab.path);
    return node?.meta?.title || tab.title;
};

/* ---------- 标签溢出滚动开始 ----------
 * 控制位置：标签过多时左右滚动按钮和滚动容器状态。
 * 只测量滚动容器 scrollWidth / clientWidth / scrollLeft，不逐个计算标签位置，保持 O(1)。
 * ResizeObserver 同时监听容器和内部内容宽度；卸载时断开，避免泄漏。
 * ---------- 标签溢出滚动结束 ---------- */
const scrollRef = ref<HTMLElement | null>(null);
const needScroll = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
let scrollRO: ResizeObserver | null = null;

const updateScrollState = () => {
    const el = scrollRef.value;
    if (!el) {
        needScroll.value = false;
        canScrollLeft.value = false;
        canScrollRight.value = false;
        return;
    }
    // 1px 容差，避免亚像素导致按钮闪烁
    const overflow = el.scrollWidth > el.clientWidth + 1;
    needScroll.value = overflow;
    canScrollLeft.value = overflow && el.scrollLeft > 1;
    canScrollRight.value = overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
};

const scrollByPage = (dir: -1 | 1) => {
    const el = scrollRef.value;
    if (!el) return;
    el.scrollBy({left: dir * el.clientWidth * 0.8, behavior: "smooth"});
};

const scrollActiveIntoView = () => {
    nextTick(() => {
        const el = scrollRef.value;
        const active = el?.querySelector(".tab-item.active") as HTMLElement | null;
        active?.scrollIntoView({inline: "nearest", block: "nearest", behavior: "smooth"});
        updateScrollState();
    });
};

onMounted(() => {
    window.addEventListener("mousedown", onWinMouseDown, true);
    window.addEventListener("keydown", onWinKeydown);
    const el = scrollRef.value;
    if (!el) return;
    scrollRO = new ResizeObserver(() => updateScrollState());
    scrollRO.observe(el);
    const inner = el.querySelector(".tabs-inner");
    if (inner) scrollRO.observe(inner);
    el.addEventListener("scroll", updateScrollState, {passive: true});
    updateScrollState();
});

onUnmounted(() => {
    scrollRO?.disconnect();
    scrollRO = null;
    scrollRef.value?.removeEventListener("scroll", updateScrollState);
    stopDropHoverWatch();
    stopWinDragOver();
    window.removeEventListener("mousedown", onWinMouseDown, true);
    window.removeEventListener("keydown", onWinKeydown);
});

watch(() => tabs.value.length, () => nextTick(updateScrollState));
watch(activePath, () => scrollActiveIntoView());
</script>

<template>
  <div
      ref="barRef"
      class="tabs-bar"
      :class="['is-tab-' + settingsStore.tabStyle, { 'is-tab-dragging': dragFrom >= 0 || dropHoverIndex >= 0 }]"
  >
    <!-- 向左滚动：仅标签展示不全时显示；已到最左则禁用 -->
    <div
        v-if="needScroll"
        class="tab-scroll-btn"
        :class="{ 'is-disabled': !canScrollLeft }"
        @click="canScrollLeft && scrollByPage(-1)"
    >
      <el-icon :size="16"><ArrowLeft/></el-icon>
    </div>
    <!-- 左侧标签滚动区 -->
    <div
        ref="scrollRef"
        class="tabs-scroll"
        @dragover="onTabsDragOver"
        @drop.prevent
    >
      <TransitionGroup name="tab-flip" tag="div" class="tabs-inner">
        <div
            v-for="(tab, index) in tabs"
            :key="tab.path"
            class="tab-item"
            :class="{ active: tab.path === activePath, 'is-dragging': dragFrom === index, 'is-drag-hover': dragFrom === index || dropHoverIndex === index }"
            :draggable="settingsStore.tabDrag"
            @click="handleClick(tab)"
            @mousedown="onTabMouseDown"
            @contextmenu="onTabContextMenu($event, tab)"
            @dragstart="onTabDragStart(index, $event)"
            @dragend="onTabDragEnd"
        >
          <span class="tab-title">{{ $t(`menu.${getTitle(tab)}`) }}</span>
          <el-icon
              v-if="!tab.affix"
              class="tab-close"
              @click="handleClose(tab.path, $event)"
              @dragstart.prevent.stop
          >
            <Close/>
          </el-icon>
        </div>
      </TransitionGroup>
    </div>
    <!-- 向右滚动：仅标签展示不全时显示；已到最右则禁用 -->
    <div
        v-if="needScroll"
        class="tab-scroll-btn"
        :class="{ 'is-disabled': !canScrollRight }"
        @click="canScrollRight && scrollByPage(1)"
    >
      <el-icon :size="16"><ArrowRight/></el-icon>
    </div>

    <!-- 右侧操作区 -->
    <div class="tabs-actions">
      <div class="action-btn" @click="handleRefresh">
        <el-icon :size="16"><Refresh/></el-icon>
        <el-tooltip :content="$t('system.refresh')" placement="bottom"/>
      </div>
      <el-dropdown ref="tabOpsRef" trigger="click" @command="handleCommand" @visible-change="onOpsVisible">
        <div class="action-btn" @click="onOpsBtnClick">
          <el-icon :size="16"><IconMenu/></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
                v-for="it in opsItems"
                :key="it.cmd"
                :command="it.cmd"
                :disabled="it.disabled"
                :divided="it.divided"
            >
              <el-icon><component :is="it.icon"/></el-icon>{{ $t(it.labelKey) }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
  <Teleport to="body">
    <div
        v-if="ctxVisible"
        ref="ctxMenuRef"
        class="el-dropdown__popper el-popper is-light is-pure tab-ctx-menu"
        :style="{ left: ctxPos.x + 'px', top: ctxPos.y + 'px' }"
        @contextmenu.prevent
    >
      <ul class="el-dropdown-menu">
        <template v-for="it in opsItems" :key="it.cmd">
          <li v-if="it.divided" role="separator" class="el-dropdown-menu__item--divided"/>
          <li
              class="el-dropdown-menu__item"
              :class="{ 'is-disabled': it.disabled }"
              @click="onCtxItem(it.cmd, it.disabled)"
          >
            <el-icon><component :is="it.icon"/></el-icon>{{ $t(it.labelKey) }}
          </li>
        </template>
      </ul>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
/* ==================== 标签栏外层容器开始 ====================
 * 控制位置：右侧布局中 Header 下方的 .tabs-bar。
 * 内部包含：左滚动按钮、标签滚动区、右滚动按钮、右侧操作按钮。
 * 修改这里会影响：标签栏高度、背景、底部分隔线、三种 tabStyle 的公共基础样式。
 */
.tabs-bar {
  /* 标签栏内部横向排列 */
  display: flex;
  /* 标签、滚动按钮、操作按钮垂直居中 */
  align-items: center;
  /* 标签栏固定高度，会参与 Main 剩余高度计算 */
  height: 40px;
  /* 顶部边框由 Header 提供，这里只保留底部边框，避免双线变粗 */
  border-bottom: 1px solid var(--el-border-color);
  /* 标签栏背景色，跟随浅色/夜间主题 */
  background-color: var(--el-bg-color);

  /* ==================== 标签左右滚动按钮开始 ====================
   * 控制位置：标签过多溢出时出现的左/右箭头按钮 .tab-scroll-btn。
   * 修改这里会影响：滚动按钮宽度、颜色、hover、禁用状态。
   */
  .tab-scroll-btn {
    /* 不参与压缩，保证按钮宽度固定 */
    flex-shrink: 0;
    /* 箭头图标居中 */
    display: flex;
    align-items: center;
    justify-content: center;
    /* 滚动按钮固定宽度 */
    width: 28px;
    /* 撑满标签栏高度 */
    height: 100%;
    /* 鼠标手势提示可点击 */
    cursor: pointer;
    /* 默认箭头颜色 */
    color: var(--el-text-color-regular);
    /* hover 颜色和背景过渡 */
    transition: color 0.2s, background-color 0.2s;

    /* 可点击状态 hover：主色箭头 + 浅色背景 */
    &:hover:not(.is-disabled) {
      color: var(--el-color-primary);
      background-color: var(--el-fill-color-light);
    }

    /* 已滚到最左/最右时的禁用状态 */
    &.is-disabled {
      color: var(--el-text-color-disabled);
      cursor: not-allowed;
    }
  }
  /* ==================== 标签左右滚动按钮结束 ==================== */

  /* ==================== 标签横向滚动容器开始 ====================
   * 控制位置：包住 TransitionGroup 的 .tabs-scroll。
   * 修改这里会影响：标签是否横向滚动、原生滚动条是否显示、拖拽 over 事件区域。
   */
  .tabs-scroll {
    /* 占据左右滚动按钮和右侧操作区之外的剩余宽度 */
    flex: 1;
    /* 允许横向滚动 */
    overflow-x: auto;
    /* 禁止纵向溢出，避免标签栏变高 */
    overflow-y: hidden;
    /* 撑满标签栏高度 */
    height: 100%;

    /* 隐藏 WebKit 浏览器下的横向滚动条，滚动通过左右按钮或触控板完成 */
    &::-webkit-scrollbar {
      height: 0;
    }
  }
  /* ==================== 标签横向滚动容器结束 ==================== */

  /* ==================== 标签列表内层开始 ====================
   * 控制位置：TransitionGroup 渲染出的 .tabs-inner。
   * 修改这里会影响：所有标签的横向排列、内边距、是否换行。
   */
  .tabs-inner {
    /* 标签项横向排列 */
    display: flex;
    /* 标签项垂直居中 */
    align-items: center;
    /* 内层高度撑满标签栏 */
    height: 100%;
    /* 标签列表左右留白 */
    padding: 0 12px;
    /* 标签标题不换行，保证横向滚动 */
    white-space: nowrap;
  }
  /* ==================== 标签列表内层结束 ==================== */

  /* 换位 FLIP：被挤开的标签平滑滑过去；正在拖的那项立刻落位，不跟拖影抢动画 */
  .tab-flip-move:not(.is-dragging) {
    transition: transform 0.22s ease;
  }

  /* ==================== 单个标签公共样式开始 ====================
   * 控制位置：每一个 .tab-item。
   * 这是 smart / card / google 三种风格都会继承的公共基础。
   * 修改这里会影响：标签默认高度、内边距、标题颜色、关闭按钮显示、激活下划线。
   */
  .tab-item {
    /* 给激活下划线、拖拽占位线提供定位上下文 */
    position: relative;
    /* 标题和关闭按钮横向排列 */
    display: inline-flex;
    /* 标题和关闭按钮垂直居中 */
    align-items: center;
    /* smart 风格下标签撑满标签栏高度 */
    height: 100%;
    /* 标签左右内边距 */
    padding: 0 12px;
    /* 标签标题字号 */
    font-size: 13px;
    /* 未激活标签文字颜色 */
    color: var(--el-text-color-secondary);
    /* 默认透明背景，由不同风格覆盖 */
    background: transparent;
    /* 默认无边框 */
    border: none;
    /* smart 风格默认无圆角 */
    border-radius: 0;
    /* 鼠标手势提示可点击切换 */
    cursor: pointer;
    /* 文字颜色过渡 */
    transition: color 0.2s;

    /* 拖着走时：栏内实体项半透明占位，和旁边实标签、浏览器拖影区分开 */
    &.is-dragging {
      opacity: 0.4;
    }

    &.is-dragging::before {
      content: "";
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 0;
      right: 0;
      border-left: 1px dashed var(--el-color-primary);
      border-right: 1px dashed var(--el-color-primary);
      pointer-events: none;
    }

    /* 标签 hover：文字变主色，并显示关闭按钮 */
    &:hover {
      color: var(--el-color-primary);

      .tab-close {
        opacity: 1;
      }
    }

    /* 激活态：蓝色文字 + 底部蓝色下划线（整条标签宽，紧贴下边框） */
    &.active {
      color: var(--el-color-primary);

      &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        background-color: var(--el-color-primary);
      }

      .tab-close {
        opacity: 1;
      }
    }

    /* 标签标题文本：限制最大宽度并超出省略 */
    .tab-title {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;
    }

    /* 标签关闭按钮：默认隐藏，hover 或 active 时显示 */
    .tab-close {
      margin-left: 6px;
      font-size: 12px;
      opacity: 0;
      border-radius: 50%;
      transition: opacity 0.2s, color 0.2s, background-color 0.2s;

      &:hover {
        color: var(--el-color-danger);
        background-color: var(--el-fill-color-dark);
      }
    }
  }
  /* ==================== 单个标签公共样式结束 ==================== */

  /* ==================== 拖拽中关闭按钮修正开始 ====================
   * 控制位置：拖拽标签时所有 tab-item 的关闭按钮显示逻辑。
   * 目的：避免鼠标还停在旧槽位上时，旧槽位邻居因为 :hover 显示关闭按钮。
   */
  /* 拖动中：关闭钮跟被拖项走，旧槽位邻居不要因 :hover 再亮出来 */
  &.is-tab-dragging .tab-item {
    &:not(.is-drag-hover):not(.active):hover .tab-close {
      opacity: 0;
    }

    &.is-drag-hover:not(.active) .tab-close {
      opacity: 1;
    }
  }
  /* ==================== 拖拽中关闭按钮修正结束 ==================== */

  /* ==================== 灵动风格拖拽悬浮修正开始 ====================
   * 控制位置：settingsStore.tabStyle === "smart" 且正在拖拽时的文字颜色。
   * 目的：旧槽位邻居不要被浏览器残留 hover 改成主题色，只有被拖/落下项保持主色。
   */
  /* 灵动：邻居不要被停在旧槽位的 :hover 改成主题色；被拖项自己保持悬停字色 */
  &.is-tab-smart.is-tab-dragging .tab-item {
    &:not(.is-drag-hover):not(.active):hover {
      color: var(--el-text-color-secondary);
    }

    &.is-drag-hover:not(.active) {
      color: var(--el-color-primary);
    }
  }
  /* ==================== 灵动风格拖拽悬浮修正结束 ==================== */

  /* ==================== 标签栏右侧操作区开始 ====================
   * 控制位置：标签栏最右侧 .tabs-actions。
   * 内部包含：刷新按钮、更多操作下拉按钮。
   * 修改这里会影响：右侧按钮排列、按钮尺寸、hover 背景。
   */
  .tabs-actions {
    /* 操作按钮横向排列 */
    display: flex;
    /* 操作按钮垂直居中 */
    align-items: center;
    /* 操作区撑满标签栏高度 */
    height: 100%;
    /* 操作区左右留白 */
    padding: 0 8px;

    /* 单个操作按钮：刷新、更多菜单 */
    .action-btn {
      /* 给 tooltip 或未来角标提供定位上下文 */
      position: relative;
      /* 图标居中 */
      display: flex;
      align-items: center;
      justify-content: center;
      /* 操作按钮尺寸 */
      width: 32px;
      height: 32px;
      /* 按钮之间的距离 */
      margin-left: 4px;
      /* 鼠标手势提示可点击 */
      cursor: pointer;
      /* 按钮圆角 */
      border-radius: 4px;
      /* 默认图标颜色 */
      color: var(--el-text-color-regular);
      /* hover 过渡 */
      transition: all 0.2s;

      /* 操作按钮 hover：主色图标 + 浅填充背景 */
      &:hover {
        color: var(--el-color-primary);
        background-color: var(--el-fill-color-light);
      }
    }
  }

  /* 卡片 / 谷歌共用选中底色：约 16% 主色叠白（本项目 light-9 混成了 90% 主色，不能直接用） */
  $tab-active-bg: color-mix(in srgb, var(--el-color-primary) 16%, #ffffff);

  /* ==================== 卡片页签风格开始 ====================
   * 启用条件：settingsStore.tabStyle === "card"，tabs-bar class 包含 is-tab-card。
   * 控制效果：标签变成栏内居中的矮圆角块，未选中浅灰底，选中浅主题色。
   * 修改这里会影响：卡片风格的间距、高度、圆角、背景和激活态。
   */
  &.is-tab-card {
    /* 卡片标签之间的间距 */
    .tabs-inner {
      gap: 6px;
    }

    /* 卡片风格单个标签 */
    .tab-item {
      height: 28px;
      border-radius: 6px;
      color: var(--el-text-color-primary);
      background-color: var(--el-fill-color-light);
      box-sizing: border-box;
      transition: color 0.2s, background-color 0.2s;

      &:hover {
        color: var(--el-text-color-primary);
      }

      &.active {
        color: var(--el-color-primary);
        background-color: $tab-active-bg;

        &::after {
          display: none;
        }
      }
    }
  }
  /* ==================== 卡片页签风格结束 ==================== */

  /* ==================== 谷歌页签风格开始 ====================
   * 启用条件：settingsStore.tabStyle === "google"，tabs-bar class 包含 is-tab-google。
   * 控制效果：用 mask-border 切出类似 Chrome 标签页的轮廓。
   * 修改这里会影响：Chrome 形状、重叠宽度、激活层级、hover 背景、拖拽显示。
   */
  $chrome-mask: url("data:image/svg+xml,%3Csvg width='68' height='34' viewBox='0 0 68 34' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m27,0c-7.99582,0 -11.95105,0.00205 -12,12l0,6c0,8.284 -0.48549,16.49691 -8.76949,16.49691l54.37857,-0.11145c-8.284,0 -8.60908,-8.10146 -8.60908,-16.38546l0,-6c0.11145,-12.08445 -4.38441,-12 -12,-12l-13,0z' fill='%23000'/%3E%3C/svg%3E");

  &.is-tab-google {
    /* Google 风格内层：让标签填满高度并给左右重叠留空间 */
    .tabs-inner {
      box-sizing: border-box;
      align-items: stretch;
      padding: 3px 20px 0;
    }

    /* Google 风格单个标签 */
    .tab-item {
      z-index: 1;
      margin: 0 -10px;
      padding: 0 28px;
      color: var(--el-text-color-regular);
      -webkit-mask-box-image: $chrome-mask 12 27 15 fill;

      /* Google 风格 hover：提高层级并显示浅色背景 */
      &:hover,
      &.is-drag-hover:not(.active) {
        z-index: 2;
        background-color: var(--el-fill-color);
      }

      /* 谷歌底本身就浅，沿用 0.4 会像没底；拖动时只略虚一点 */
      &.is-dragging {
        opacity: 0.8;
      }

      /* Google 风格激活态：最高层级 + 主色文字 + 浅主题背景 */
      &.active {
        z-index: 3;
        color: var(--el-color-primary);
        background-color: $tab-active-bg;

        &::after {
          display: none;
        }
      }
    }

    /* 拖着不松手换向时，光标还在旧槽位上，邻居不要再亮悬停底 */
    &.is-tab-dragging .tab-item:not(.is-drag-hover):not(.active):hover {
      z-index: 1;
      color: var(--el-text-color-regular);
      background-color: transparent;
    }
  }
  /* ==================== 谷歌页签风格结束 ==================== */
}
/* ==================== 标签栏外层容器结束 ==================== */

/* ==================== 标签右键菜单开始 ====================
 * 控制位置：Teleport 到 body 的右键菜单 .tab-ctx-menu。
 * 这里仍写在 scoped 中，因为 Teleport 节点 class 来自当前模板，Vue 会带上 scoped 属性。
 * 修改这里会影响：右键菜单定位方式和层级。
 */
.tab-ctx-menu {
  /* 使用 fixed，坐标直接取鼠标在视口中的 clientX/clientY */
  position: fixed;
  /* 高于 Header、抽屉、普通弹层，确保右键菜单不被遮挡 */
  z-index: 4000;
  /* 清掉 el-popper 默认 margin，避免坐标偏移 */
  margin: 0;
}
/* ==================== 标签右键菜单结束 ==================== */
</style>
