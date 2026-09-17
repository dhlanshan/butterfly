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
    if (route.path !== tab.path) {
        router.push(tab.fullPath || tab.path);
    }
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
});

watch(() => tabs.value.length, () => nextTick(updateScrollState));
watch(activePath, () => scrollActiveIntoView());
</script>

<template>
  <div class="tabs-bar">
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
    <div ref="scrollRef" class="tabs-scroll">
      <div class="tabs-inner">
        <div
            v-for="tab in tabs"
            :key="tab.path"
            class="tab-item"
            :class="{ active: tab.path === activePath }"
            @click="handleClick(tab)"
        >
          <span class="tab-title">{{ $t(`menu.${getTitle(tab)}`) }}</span>
          <el-icon
              v-if="!tab.affix"
              class="tab-close"
              @click="handleClose(tab.path, $event)"
          >
            <Close/>
          </el-icon>
        </div>
      </div>
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
  border-bottom: 1px solid #f0f0f0;
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
}
</style>
