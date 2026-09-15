<script setup lang="ts">
import {Fold, Expand} from "@element-plus/icons-vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useRoutingMethod} from "@/hooks/useRoutingMethod.ts";
import {useRoute} from "vue-router";

const settingsStore = useSettingsStoreHook();
const route = useRoute();
const {getAllParentRoute} = useRoutingMethod();

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
      折叠按钮：
      - side / mix 桌面端：有侧边栏，展示按钮控制折叠。
      - top 桌面端：无侧边栏，隐藏。
      - 移动端：所有模式都展示（用于打开抽屉式菜单，与 side 模式一致）。
    -->
    <div
        v-if="settingsStore.menuLayout !== 'top' || settingsStore.isMobile"
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
.header-left {
  display: flex;
  align-items: center;
  height: 100%;
  /* 默认按内容宽度，避免挤压横向菜单；side 模式下撑满把右侧推到最右 */
  flex: 0 0 auto;
  overflow: hidden;

  &.is-flex-fill {
    flex: 1;
  }

  .collapse-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 100%;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  .breadcrumb {
    margin-left: 8px;
    white-space: nowrap;
    overflow: hidden;

    /* 覆盖 Element Plus 默认：非当前项（父级/目录）改为普通字重 + 浅灰 */
    :deep(.el-breadcrumb__inner) {
      font-weight: 400;
      color: var(--el-text-color-secondary);

      /* 可点击的叶子项（type 2）保留链接 hover 效果 */
      &.is-link {
        color: var(--el-text-color-secondary);
        transition: color 0.2s;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }

    /* 当前页（最后一项）：加粗 + 深色 */
    :deep(.is-current .el-breadcrumb__inner) {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}
</style>
