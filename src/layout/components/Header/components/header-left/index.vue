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
  <div class="header-left">
    <!-- 折叠按钮（始终展示） -->
    <div class="collapse-trigger" @click="settingsStore.toggleCollapse">
      <el-icon :size="20">
        <Expand v-if="settingsStore.collapsed"/>
        <Fold v-else/>
      </el-icon>
    </div>
    <!-- 面包屑（移动端隐藏） -->
    <el-breadcrumb
        v-show="!settingsStore.isMobile"
        class="breadcrumb"
        separator="/"
    >
      <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="item.path"
          :class="{ 'is-current': index === breadcrumbs.length - 1 }"
          :to="index === breadcrumbs.length - 1 ? undefined : { path: item.path }"
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
  flex: 1;
  overflow: hidden;

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

    /* 覆盖 Element Plus 默认：链接项（父级）改为普通字重 + 浅灰 */
    :deep(.el-breadcrumb__inner.is-link) {
      font-weight: 400;
      color: var(--el-text-color-secondary);
    }

    /* 当前页（最后一项）：加粗 + 深色 */
    :deep(.is-current .el-breadcrumb__inner) {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}
</style>
