<script setup lang="ts">
import {useRouter, useRoute} from "vue-router";
import {Refresh, Menu as IconMenu, Close} from "@element-plus/icons-vue";
import {useTabsStoreHook} from "@/store/modules/tabs.ts";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {storeToRefs} from "pinia";
import {findCategoryById} from "@/utils/other.ts";

const router = useRouter();
const route = useRoute();
const tabsStore = useTabsStoreHook();
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
const refreshKey = ref(0);
const handleRefresh = () => {
    refreshKey.value++;
    // 通过 replace 重新进入当前路由以触发组件重建
    const {fullPath} = route;
    router.replace({path: "/redirect" + fullPath}).catch(() => {
        // 若无 redirect 路由，则降级为强制刷新当前组件
    });
};

/* ---------- 标签操作下拉 ---------- */
const handleCommand = (cmd: string) => {
    const path = activePath.value;
    let next: string | null = null;
    switch (cmd) {
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
    }
    if (next) router.push(next);
};

/* ---------- 标签标题：通过 routeTree 查找 meta.title ---------- */
const getTitle = (tab: any) => {
    const node = findCategoryById(routeTree.value, "path", tab.path);
    return node?.meta?.title || tab.title;
};
</script>

<template>
  <div class="tabs-bar">
    <!-- 左侧标签滚动区 -->
    <div class="tabs-scroll">
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
            <el-dropdown-item command="close-current">
              {{ $t("system.close-current") }}
            </el-dropdown-item>
            <el-dropdown-item command="close-left-side">
              {{ $t("system.close-left-side") }}
            </el-dropdown-item>
            <el-dropdown-item command="close-right-side">
              {{ $t("system.close-right-side") }}
            </el-dropdown-item>
            <el-dropdown-item command="close-other">
              {{ $t("system.close-other") }}
            </el-dropdown-item>
            <el-dropdown-item command="close-all" divided>
              {{ $t("system.close-all") }}
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
