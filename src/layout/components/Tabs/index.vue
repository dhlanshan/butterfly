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

/* ---------- 监听路由变化，自动添加标签 ---------- */
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

/* ---------- 路由树就绪后，批量校正所有持久化标签的 meta 快照 ---------- */
// 路由配置变更（如改 affix）后刷新页面，持久化恢复出的旧标签（含非激活）需按最新 meta 全部刷新。
// immediate: 处理「Tabs 挂载时 routeTree 已构建好」的情况；routeTree 后续变化（重新初始化）时再触发。
// deep: false：initSetRouter 是整体重新赋值 routeTree.value（引用变化即触发），无需深监听，避免对大树深比较的开销。
watch(
    routeTree,
    (tree) => tabsStore.reconcileWithRouteTree(tree),
    {immediate: true, deep: false}
);

/* ---------- 点击标签跳转 ---------- */
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

/* ---------- 页签拖拽换位（仅 settings.tabDrag 开启时） ---------- */
// 被拖标签相对「当前槽位」移动超过自身一半宽度，就和相邻项换位；换完把槽位原点挪到新位置，可连续换。
const dragFrom = ref(-1);
// 松手后 :hover 还停在旧槽位；先把悬停钉在落下的标签上，指针真正移动后再交给原生 hover
const dropHoverIndex = ref(-1);
let skipTabClick = false;
let skipTabPath = "";
let dragOffsetX = 0;
let dragWidth = 0;
let slotOriginLeft = 0;
let lastDragX = 0;
let lastDragY = 0;
let onDropHoverPointerMove: ((e: PointerEvent) => void) | null = null;

const stopDropHoverWatch = () => {
    if (!onDropHoverPointerMove) return;
    window.removeEventListener("pointermove", onDropHoverPointerMove);
    onDropHoverPointerMove = null;
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
    dragWidth = rect.width || 80;
    slotOriginLeft = rect.left;
    const dt = e.dataTransfer;
    if (!dt) return;
    dt.effectAllowed = "move";
    dt.setData("text/plain", String(index));
};

const onTabsDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    const from = dragFrom.value;
    if (from < 0 || !scrollRef.value) return;
    const ghostLeft = e.clientX - dragOffsetX;
    const delta = ghostLeft - slotOriginLeft;
    const half = dragWidth / 2;
    const items = scrollRef.value.querySelectorAll(".tab-item");
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

/* ---------- 关闭标签 ---------- */
const handleClose = (path: string, e: MouseEvent) => {
    e.stopPropagation();
    const next = tabsStore.closeTab(path);
    if (next) router.push(next);
};

/* ---------- 刷新当前页 ---------- */
// 通过递增 routeReloadKey 让 Main 里的 :key 变化，强制当前路由组件重挂载（重新加载）。
// 不再依赖额外的 /redirect 路由，避免跳到不存在的路由导致空白。
const handleRefresh = () => {
    settingsStore.reloadCurrentRoute();
};

/* ---------- 内容区全屏 ---------- */
// 在 html 上切换 content-fullscreen class，由全局 CSS 隐藏侧边栏/Header，
// 但保留标签栏，让主内容区铺满剩余空间。再次点击退出。
const isContentFullscreen = ref(false);
const toggleContentFullscreen = () => {
    isContentFullscreen.value = !isContentFullscreen.value;
    document.documentElement.classList.toggle("content-fullscreen", isContentFullscreen.value);
};

/* ---------- 标签操作下拉 ---------- */
const handleCommand = (cmd: string) => {
    const path = activePath.value;
    let next: string | null = null;
    switch (cmd) {
        case "reload":
            handleRefresh();
            return;
        case "close-current":
            next = tabsStore.closeTab(path);
            break;
        case "close-left-side":
            tabsStore.closeLeft(path);
            break;
        case "close-right-side":
            tabsStore.closeRight(path);
            break;
        case "close-other":
            tabsStore.closeOther(path);
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

/* ---------- 各操作的可用性（用于禁用不可执行的项） ---------- */
// 当前激活标签索引
const activeIdx = computed(() => tabs.value.findIndex(t => t.path === activePath.value));
// 当前激活标签是否可关闭（非固定 affix）
const canCloseCurrent = computed(() => {
    const t = tabs.value[activeIdx.value];
    return !!t && !t.affix;
});
// 左侧是否存在可关闭标签（非 affix）
const canCloseLeft = computed(() =>
    tabs.value.some((t, i) => i < activeIdx.value && !t.affix)
);
// 右侧是否存在可关闭标签
const canCloseRight = computed(() =>
    tabs.value.some((t, i) => i > activeIdx.value && !t.affix)
);
// 是否存在其他可关闭标签（除当前外还有非 affix）
const canCloseOther = computed(() =>
    tabs.value.some(t => !t.affix && t.path !== activePath.value)
);
// 是否存在任何可关闭标签
const canCloseAll = computed(() => tabs.value.some(t => !t.affix));

/* ---------- 标签标题：通过 routeTree 查找 meta.title ---------- */
const getTitle = (tab: any) => {
    const node = findCategoryById(routeTree.value, "path", tab.path);
    return node?.meta?.title || tab.title;
};

/* ---------- 标签溢出滚动（左右按钮仅在展示不全时出现） ---------- */
// 只量滚动容器：scrollWidth / clientWidth / scrollLeft，不对每个标签算位置（O(1)）。
// ResizeObserver 听容器与内容宽度；scroll 用 passive 更新能否继续滚。卸载时断开，防泄漏。
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
});

watch(() => tabs.value.length, () => nextTick(updateScrollState));
watch(activePath, () => scrollActiveIntoView());
</script>

<template>
  <div
      class="tabs-bar"
      :class="['is-tab-' + settingsStore.tabStyle, { 'is-tab-drag': settingsStore.tabDrag, 'is-tab-dragging': dragFrom >= 0 || dropHoverIndex >= 0 }]"
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
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="action-btn">
          <el-icon :size="16"><IconMenu/></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <!-- 重新加载 -->
            <el-dropdown-item command="reload">
              <el-icon><Refresh/></el-icon>{{ $t("system.reload") }}
            </el-dropdown-item>
            <el-dropdown-item divided command="close-current" :disabled="!canCloseCurrent">
              <el-icon><Close/></el-icon>{{ $t("system.close-current-tab") }}
            </el-dropdown-item>
            <el-dropdown-item command="close-left-side" :disabled="!canCloseLeft">
              <el-icon><Back/></el-icon>{{ $t("system.close-left-tab") }}
            </el-dropdown-item>
            <el-dropdown-item divided command="close-right-side" :disabled="!canCloseRight">
              <el-icon><Right/></el-icon>{{ $t("system.close-right-tab") }}
            </el-dropdown-item>
            <el-dropdown-item command="close-other" :disabled="!canCloseOther">
              <el-icon><IconSwitch/></el-icon>{{ $t("system.close-other-tab") }}
            </el-dropdown-item>
            <el-dropdown-item divided command="close-all" :disabled="!canCloseAll">
              <el-icon><Minus/></el-icon>{{ $t("system.close-all-tab") }}
            </el-dropdown-item>
            <el-dropdown-item divided command="content-fullscreen">
              <el-icon><component :is="isContentFullscreen ? Aim : FullScreen"/></el-icon>
              {{ isContentFullscreen ? $t("system.exit-content-fullscreen") : $t("system.content-fullscreen") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabs-bar {
  display: flex;
  align-items: center;
  height: 40px;
  /* 顶部边框由 Header 提供，这里只保留底部边框，避免双线变粗 */
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);

  .tab-scroll-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 100%;
    cursor: pointer;
    color: var(--el-text-color-regular);
    transition: color 0.2s, background-color 0.2s;

    &:hover:not(.is-disabled) {
      color: var(--el-color-primary);
      background-color: var(--el-fill-color-light);
    }

    &.is-disabled {
      color: var(--el-text-color-disabled);
      cursor: not-allowed;
    }
  }

  .tabs-scroll {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    height: 100%;

    &::-webkit-scrollbar {
      height: 0;
    }
  }

  .tabs-inner {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 12px;
    white-space: nowrap;
  }

  /* 换位 FLIP：被挤开的标签平滑滑过去；正在拖的那项立刻落位，不跟拖影抢动画 */
  .tab-flip-move:not(.is-dragging) {
    transition: transform 0.22s ease;
  }

  .tab-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: 100%;
    padding: 0 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: transparent;
    border: none;
    border-radius: 0;
    cursor: pointer;
    transition: color 0.2s;

    /* 拖着走时：真标签留在栏里，左右虚线标出落点；半透明影子由浏览器拖影提供 */
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

    .tab-title {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;
    }

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

  /* 开启页签拖动后：抓手光标提示可拖 */
  &.is-tab-drag .tab-item {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  /* 拖动中：关闭钮跟被拖项走，旧槽位邻居不要因 :hover 再亮出来 */
  &.is-tab-dragging .tab-item {
    &:not(.is-drag-hover):not(.active):hover .tab-close {
      opacity: 0;
    }

    &.is-drag-hover:not(.active) .tab-close {
      opacity: 1;
    }
  }

  .tabs-actions {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;

    .action-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-left: 4px;
      cursor: pointer;
      border-radius: 4px;
      color: var(--el-text-color-regular);
      transition: all 0.2s;

      &:hover {
        color: var(--el-color-primary);
        background-color: var(--el-fill-color-light);
      }
    }
  }

  /* 卡片 / 谷歌共用选中底色：约 16% 主色叠白（本项目 light-9 混成了 90% 主色，不能直接用） */
  $tab-active-bg: color-mix(in srgb, var(--el-color-primary) 16%, #ffffff);

  /* ---------- 卡片：矮圆角块在栏内垂直居中；未选中浅灰底，选中浅主题色 ---------- */
  &.is-tab-card {
    .tabs-inner {
      gap: 6px;
    }

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

  /* ---------- 谷歌：mask-border 切 Chrome 轮廓，底角尖尾在 slice 里不拉伸 ---------- */
  $chrome-mask: url("data:image/svg+xml,%3Csvg width='68' height='34' viewBox='0 0 68 34' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m27,0c-7.99582,0 -11.95105,0.00205 -12,12l0,6c0,8.284 -0.48549,16.49691 -8.76949,16.49691l54.37857,-0.11145c-8.284,0 -8.60908,-8.10146 -8.60908,-16.38546l0,-6c0.11145,-12.08445 -4.38441,-12 -12,-12l-13,0z' fill='%23000'/%3E%3C/svg%3E");

  &.is-tab-google {
    .tabs-inner {
      box-sizing: border-box;
      align-items: stretch;
      padding: 3px 20px 0;
    }

    .tab-item {
      z-index: 1;
      margin: 0 -10px;
      padding: 0 28px;
      color: var(--el-text-color-regular);
      -webkit-mask-box-image: $chrome-mask 12 27 15 fill;

      &:hover,
      &.is-drag-hover:not(.active) {
        z-index: 2;
        background-color: var(--el-fill-color);
      }

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
      background-color: transparent;
    }
  }
}
</style>
