<script setup lang="ts">
import {Fold, Expand} from "@element-plus/icons-vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {useRoutingMethod} from "@/hooks/useRoutingMethod.ts";
import {hasMixSidebar} from "@/hooks/useMenuLayout.ts";
import {useRoute} from "vue-router";
import {storeToRefs} from "pinia";

const settingsStore = useSettingsStoreHook();
const {routeTree} = storeToRefs(useRouteConfigStoreHook());
const route = useRoute();
const {getAllParentRoute} = useRoutingMethod();

/**
 * 折叠按钮是否展示：必须与 Aside 的 showAside 条件一致，否则会出现
 * 「侧边栏已卸掉、按钮还在、点了没反应」的假折叠。
 * - 移动端：始终展示（抽屉开关）
 * - top 桌面端：无侧边栏，隐藏
 * - mix 桌面端：命中顶层项即展示（目录有子菜单 / 叶子回显自身）
 * - side 桌面端：始终展示
 */
const showCollapseTrigger = computed(() => {
    if (settingsStore.isMobile) return true;
    if (settingsStore.menuLayout === "top") return false;
    if (settingsStore.menuLayout === "mix") return hasMixSidebar(route.path, routeTree.value);
    return true;
});

// 当前路由的所有父级（含自身），用于生成面包屑
const breadcrumbs = computed(() => {
    const list = getAllParentRoute(route.path) || [];
    // 过滤掉没有 title 的节点（如根 layout）
    return list.filter((item: any) => item?.meta?.title);
});
</script>

<template>
  <!--
    is-flex-fill：让左侧撑满，把右侧操作区推到最右。
    - side 模式：始终撑满（无横向菜单）。
    - 移动端：所有模式都无横向菜单，撑满。
    - top / mix 桌面端：有横向菜单（flex:1）撑满，此处不撑满。
  -->
  <div
      class="header-left"
      :class="{ 'is-flex-fill': settingsStore.menuLayout === 'side' || settingsStore.isMobile }"
  >
    <!--
      折叠按钮：必须与侧边栏是否真正存在对齐。
      - side 桌面端：有侧边栏，展示。
      - mix 桌面端：命中顶层项即有侧边栏（叶子回显自身），展示折叠按钮。
      - top 桌面端：无侧边栏，隐藏。
      - 移动端：所有模式都展示（打开抽屉式菜单）。
    -->
    <div
        v-if="showCollapseTrigger"
        class="collapse-trigger"
        @click="settingsStore.toggleCollapse"
    >
      <el-icon :size="20">
        <Expand v-if="settingsStore.collapsed"/>
        <Fold v-else/>
      </el-icon>
    </div>
    <!-- 面包屑：移动端隐藏 / 设置中关闭 / 顶部或混合菜单模式下不展示（菜单已在顶部体现层级） -->
    <el-breadcrumb
        v-show="!settingsStore.isMobile && settingsStore.showBreadcrumb && settingsStore.menuLayout === 'side'"
        class="breadcrumb"
        separator="/"
    >
      <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="item.path"
          :class="{ 'is-current': index === breadcrumbs.length - 1 }"
          :to="(item.meta.type === 2 && index !== breadcrumbs.length - 1) ? { path: item.path } : undefined"
      >
        {{ $t(`menu.${item.meta.title}`) }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<style scoped lang="scss">
/* ==================== Header 左侧区域开始 ====================
 * 控制位置：Header 左侧的 .header-left，内部包含侧边栏折叠按钮和面包屑。
 * 修改这里会影响：左侧区域是否撑满、折叠按钮尺寸、面包屑显示区域。
 */
.header-left {
  /* 折叠按钮和面包屑横向排列 */
  display: flex;
  /* 与 Header 高度内垂直居中 */
  align-items: center;
  /* 占满 Header 高度，方便折叠按钮整高可点击 */
  height: 100%;
  /* 默认按内容宽度，避免挤压横向菜单；side 模式下撑满把右侧推到最右 */
  flex: 0 0 auto;
  /* 面包屑过长时不溢出覆盖中间横向菜单或右侧操作区 */
  overflow: hidden;

  /* ==================== Header 左侧撑满状态开始 ====================
   * 启用条件：side 模式或移动端。
   * 控制位置：.header-left 自身 flex 行为。
   * 作用：没有中间横向菜单时，让左侧区域撑满，把 HeaderRight 推到最右侧。
   */
  &.is-flex-fill {
    flex: 1;
  }
  /* ==================== Header 左侧撑满状态结束 ==================== */

  /* ==================== 侧边栏折叠按钮开始 ====================
   * 控制位置：Header 左侧的折叠/展开图标按钮。
   * 点击行为：template 中 @click 调用 settingsStore.toggleCollapse。
   * 修改这里会影响：按钮宽度、可点击高度、hover 背景。
   */
  .collapse-trigger {
    /* 图标居中 */
    display: flex;
    align-items: center;
    justify-content: center;
    /* 按钮固定宽度 */
    width: 40px;
    /* 按钮高度撑满 Header，提高点击区域 */
    height: 100%;
    /* 鼠标移入显示可点击手势 */
    cursor: pointer;
    /* hover 背景过渡 */
    transition: background-color 0.2s;

    /* 折叠按钮 hover 背景 */
    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
  /* ==================== 侧边栏折叠按钮结束 ==================== */

  /* ==================== 面包屑区域开始 ====================
   * 控制位置：side 模式桌面端 Header 左侧的 el-breadcrumb。
   * 显示条件：非移动端、settingsStore.showBreadcrumb 为 true、menuLayout === "side"。
   * 修改这里会影响：面包屑左间距、换行/溢出行为、文字颜色和当前项样式。
   */
  .breadcrumb {
    /* 折叠按钮和面包屑之间的距离 */
    margin-left: 8px;
    /* 面包屑不换行，避免撑高 Header */
    white-space: nowrap;
    /* 面包屑过长时裁切，避免压到右侧操作区 */
    overflow: hidden;

    /* 面包屑普通项：覆盖 Element Plus 默认字重和颜色 */
    :deep(.el-breadcrumb__inner) {
      font-weight: 400;
      color: var(--el-text-color-secondary);

      /* 可点击面包屑项：保留链接 hover 效果 */
      &.is-link {
        color: var(--el-text-color-secondary);
        transition: color 0.2s;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }

    /* 当前页面包屑：最后一项加粗并使用主要文字色 */
    :deep(.is-current .el-breadcrumb__inner) {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  /* ==================== 面包屑区域结束 ==================== */
}
/* ==================== Header 左侧区域结束 ==================== */
</style>
