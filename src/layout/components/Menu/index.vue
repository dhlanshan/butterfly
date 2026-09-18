<script setup lang="ts">
import MenuItem from './menu-item.vue'
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useRoutingMethod} from "@/hooks/useRoutingMethod.ts";

interface Props {
  routeTree: Menu.MenuOptions[];
  collapse?: boolean;
  /** 深色侧边栏：开启时菜单使用深色背景 + 浅色文字（配合 sidebarDark 设置） */
  dark?: boolean;
}

const settingsStore = useSettingsStoreHook();
// 菜单点击分流（纯外链 window.open / iframe与内部页 router.push），替代 :router=true 自动导航
const {handleMenuSelect} = useRoutingMethod();
const props = withDefaults(defineProps<Props>(), {
  routeTree: () => [],
  collapse: false,
  dark: false
});

// 深色模式下的菜单配色（若依风：深蓝底 + 浅灰文字 + 选中蓝字）
const darkColors = {
  background: "#304156",
  textColor: "#bfcbd9",
  activeTextColor: "#409eff",
};
</script>

<template>
  <el-menu
      :default-active="$route.path"
      :collapse="props.collapse"
      :collapse-transition="false"
      :unique-opened="settingsStore.menuAccordion"
      :class="{ 'is-menu-dark': props.dark, 'is-menu-night': settingsStore.isDark }"
      :background-color="props.dark ? darkColors.background : undefined"
      :text-color="props.dark ? darkColors.textColor : undefined"
      :active-text-color="props.dark ? darkColors.activeTextColor : undefined"
      popper-class="bee-menu-popup"
      :show-timeout="100"
      :hide-timeout="100"
      @select="handleMenuSelect"
  >
    <MenuItem :route-tree="props.routeTree" :collapse="props.collapse" />
  </el-menu>
</template>

<style scoped lang="scss">
.el-menu {
  border: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  gap: 4px;
  /* 折叠动画时文字从光标下划过，禁止选中以免误选 */
  user-select: none;

  /* 内嵌子菜单同样用 gap，避免 item 上下 margin 在折叠动画里撑出跳动 */
  :deep(.el-menu) {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

/* 菜单项与子菜单标题：只保留左右边距，上下间距交给 gap */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
  margin: 0 8px;
  width: calc(100% - 16px);
  border-radius: 6px;
}

/* 子菜单标题读取递归写入的缩进，和叶子项同一套层级 */
:deep(.el-sub-menu__title) {
  padding-left: var(--bee-menu-pad, 12px) !important;
}

/* 左侧菜单图标：不要写到展开箭头上，否则箭头会被撑到 20px 且垂直偏一截 */
:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon:not(.el-sub-menu__icon-arrow)) {
  width: 18px;
  font-size: 20px;
  margin-right: 8px;
}

/* 子菜单展开箭头：保持 EP 原尺寸，和 44px 行高、文字、图标同一垂直中线 */
:deep(.el-sub-menu__icon-arrow) {
  width: 12px;
  font-size: 12px;
  margin-top: -6px;
  margin-right: 0;
  right: 10px;
}

/* 折叠：64px 仅图标；去掉展开态的图标右边距，让图标在栏内左右居中 */
.el-menu--collapse {
  width: 64px;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    justify-content: center;
    padding: 0 !important;
  }

  /* 叶子项折叠后包在 tooltip 触发层里，EP 默认左右 20px padding 会把图标挤偏 */
  :deep(.el-menu-tooltip__trigger) {
    padding: 0 !important;
    justify-content: center;
  }

  :deep(.el-menu-item .el-icon),
  :deep(.el-sub-menu__title .el-icon) {
    margin-right: 0;
    margin-left: 0;
  }

  :deep(.el-sub-menu__icon-arrow) {
    display: none;
  }
}

/* 叶子项与带子菜单的标题悬停同一套底色 */
:deep(.el-menu-item:not(.is-active):hover),
:deep(.el-sub-menu__title:hover) {
  background-color: var(--el-menu-hover-bg-color);
}

/*
 * 深色侧边栏（若依风）选中态与悬停态：
 * - 选中项：浅蓝文字 + 右侧 3px 蓝色竖条 + 略浅深蓝底
 * - 悬停项：略浅深蓝底
 * 注意：el-menu-item 选中文字色由 active-text-color 控制，
 *   右侧竖条与背景在这里用 :deep 覆盖。
 */
.is-menu-dark {
  :deep(.el-menu-item.is-active) {
    background-color: #263445 !important;
    border-right: 3px solid #409eff;
  }
  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    background-color: #263445 !important;
  }
}

/* 夜模式只改选中/悬停色，不再改 margin/width */
.is-menu-night {
  :deep(.el-menu-item.is-active) {
    background-color: var(--el-color-primary) !important;
    color: #fff !important;
  }

  :deep(.el-menu-item:not(.is-active):hover),
  :deep(.el-sub-menu__title:hover) {
    background-color: var(--el-fill-color-light) !important;
  }
}
</style>

<!-- 折叠后弹出层 teleport 到 body，必须非 scoped -->
<style lang="scss">
/* 叶子标题气泡：跟 EP dark tooltip，不要清背景 */
.bee-menu-popup.el-popper.is-dark {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.2;
}

/* 带子菜单的弹出层：透明外壳 + 圆角卡片 */
.bee-menu-popup:has(.el-menu--popup) {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.bee-menu-popup {
  .el-menu--popup {
    position: relative;
    min-width: 168px;
    margin-left: 8px;
    padding: 3px 6px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-overlay);
    box-shadow: var(--el-box-shadow);

    /* 对话气泡小三角：朝向折叠侧栏图标 */
    &::before,
    &::after {
      content: "";
      position: absolute;
      top: 15px;
      width: 0;
      height: 0;
      border-style: solid;
    }

    &::before {
      left: -7px;
      border-width: 7px 7px 7px 0;
      border-color: transparent var(--el-border-color-lighter) transparent transparent;
    }

    &::after {
      left: -6px;
      border-width: 6px 6px 6px 0;
      border-color: transparent var(--el-bg-color-overlay) transparent transparent;
    }
  }

  &[data-popper-placement="right"] .el-menu--popup::before,
  &[data-popper-placement="right"] .el-menu--popup::after {
    top: 50%;
    margin-top: -7px;
  }

  &[data-popper-placement="right-end"] .el-menu--popup::before,
  &[data-popper-placement="right-end"] .el-menu--popup::after {
    top: auto;
    bottom: 20px;
  }

  .el-menu-item,
  .el-sub-menu__title {
    height: 36px !important;
    line-height: 36px !important;
    margin: 0 !important;
    width: auto !important;
    padding: 0 12px !important;
    border-radius: 6px;
  }

  .el-menu-item .el-icon:not(.el-sub-menu__icon-arrow),
  .el-sub-menu__title .el-icon:not(.el-sub-menu__icon-arrow) {
    width: 18px;
    margin-right: 8px;
    font-size: 20px;
  }

  .el-sub-menu__icon-arrow {
    width: 12px;
    font-size: 12px;
    margin-top: -6px;
    margin-right: 0;
    right: 10px;
  }

  .el-menu-item.is-active {
    color: var(--el-color-primary);
    background-color: var(--el-fill-color-light);
  }

  .el-menu-item:not(.is-active):hover,
  .el-sub-menu__title:hover {
    background-color: var(--el-fill-color-light);
  }
}
</style>
