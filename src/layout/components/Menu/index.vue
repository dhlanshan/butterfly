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

// 深色模式下的菜单配色（深色侧栏底 + 浅灰文字 + 选中蓝字）
const darkColors = {
  background: "rgb(26, 31, 46)",
  textColor: "#bfcbd9",
  activeTextColor: "#409eff",
};
</script>

<template>
  <!-- 悬浮滚动条：滑块叠在菜单上，不占用侧栏宽度 -->
  <el-scrollbar class="menu-scroll">
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
  </el-scrollbar>
</template>

<style scoped lang="scss">
/* ==================== 侧边栏菜单滚动容器开始 ====================
 * 控制位置：包裹整个 el-menu 的 el-scrollbar，也就是侧边栏菜单的可滚动区域。
 * 修改这里会影响：菜单区域高度、右侧悬浮滚动条宽度、滚动条位置、滚动条滑块样式。
 * 不影响：折叠后弹出的子菜单，因为弹出层 teleport 到 body，样式在下面非 scoped 区域。
 */
.menu-scroll {
  /* 菜单滚动区域撑满父级 .layout_side 高度 */
  height: 100%;

  /* Element Plus 垂直滚动条轨道：控制滚动条宽度和距离侧边栏右边缘的位置 */
  :deep(.el-scrollbar__bar.is-vertical) {
    width: 6px;
    right: 2px;
  }

  /* Element Plus 滚动条滑块：控制滚动时可见的灰色滑块圆角和颜色 */
  :deep(.el-scrollbar__thumb) {
    border-radius: 6px;
    background-color: rgba(144, 147, 153, 0.45);
  }
}
/* ==================== 侧边栏菜单滚动容器结束 ==================== */

/* ==================== el-menu 根容器布局开始 ====================
 * 控制位置：侧边栏内部真正的 Element Plus 菜单根节点 .el-menu。
 * 修改这里会影响：菜单边框、整体背景、菜单项纵向排列、菜单项之间的间距、文字是否可选中。
 * 这里也定义了子菜单 inline 展开后的默认背景变量 --bee-menu-child-bg。
 */
.el-menu {
  /* 去掉 Element Plus 默认右边框，避免和外层 Aside 的边框重复 */
  border: 0;
  /* 根菜单默认透明，让外层 Aside 或 el-menu 的 background-color 接管背景 */
  background-color: transparent;
  /* 让一级菜单项按列排列 */
  display: flex;
  flex-direction: column;
  /* 一级菜单项之间的竖向间距 */
  gap: 4px;
  /* 折叠动画时文字从光标下划过，禁止选中以免误选 */
  user-select: none;

  /* 内嵌子菜单布局：控制展开在侧边栏里的二级、三级等子菜单容器 */
  :deep(.el-menu) {
    /* 子菜单项继续按列排列 */
    display: flex;
    flex-direction: column;
    /* 子菜单项之间保持和一级菜单一致的间距 */
    gap: 4px;
  }

  /*
   * 层级底色：一级跟侧栏；二级及以下（含子级）统一一块底。
   * 只改 el-menu--inline（折叠弹出层是 --popup，不受影响）。
   * !important：深色侧栏时 EP 会把 background-color 写成行内深色侧栏底。
   */
  --bee-menu-child-bg: #f9f9f9;

  /* 内嵌展开的子菜单背景：只控制侧边栏里展开的子菜单，不控制折叠弹出的浮层菜单 */
  :deep(.el-menu--inline) {
    background-color: var(--bee-menu-child-bg) !important;
  }
}
/* ==================== el-menu 根容器布局结束 ==================== */

/* ==================== 菜单项基础尺寸开始 ====================
 * 控制位置：所有菜单叶子项 .el-menu-item，以及有下级菜单的标题 .el-sub-menu__title。
 * 修改这里会影响：菜单项高度、文字垂直居中、菜单项是否通栏、悬浮/选中背景是否顶到侧栏边缘。
 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  /* 每一行菜单的固定高度 */
  height: 44px;
  /* 让文字在 44px 高度内垂直居中 */
  line-height: 44px;
  /* 清掉 Element Plus 默认 margin，让菜单项通栏贴合 */
  margin: 0;
  /* 菜单项宽度占满侧边栏，选中/悬浮背景可以铺满整行 */
  width: 100%;
  /* 去掉圆角，形成整行高亮效果 */
  border-radius: 0;
}
/* ==================== 菜单项基础尺寸结束 ==================== */

/* ==================== 子菜单标题缩进开始 ====================
 * 控制位置：带 children 的菜单标题，也就是可展开/收起的那一行。
 * --bee-menu-pad 由递归菜单项写入，用于让父级标题和叶子菜单使用同一套层级缩进。
 */
:deep(.el-sub-menu__title) {
  padding-left: var(--bee-menu-pad, 12px) !important;
}
/* ==================== 子菜单标题缩进结束 ==================== */

/* ==================== 菜单左侧图标开始 ====================
 * 控制位置：菜单文字左边的业务图标，包括叶子菜单图标和父级菜单图标。
 * 注意：这里特意排除了 .el-sub-menu__icon-arrow，否则右侧展开箭头也会被当成左侧图标放大。
 */
:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon:not(.el-sub-menu__icon-arrow)) {
  /* 图标占位宽度，保证不同图标后面的文字左边界对齐 */
  width: 18px;
  /* 业务图标显示大小 */
  font-size: 20px;
  /* 图标和菜单文字之间的距离 */
  margin-right: 8px;
}
/* ==================== 菜单左侧图标结束 ==================== */

/* ==================== 子菜单展开箭头开始 ====================
 * 控制位置：带 children 的菜单右侧小箭头。
 * 修改这里会影响：箭头大小、垂直位置、距离右侧边缘的位置。
 */
:deep(.el-sub-menu__icon-arrow) {
  /* 箭头自身宽度，保持 Element Plus 默认小尺寸 */
  width: 12px;
  /* 箭头图标大小 */
  font-size: 12px;
  /* Element Plus 箭头是绝对定位，用负 margin 微调到 44px 行高的视觉中线 */
  margin-top: -6px;
  /* 清掉额外右外边距，避免箭头位置偏移 */
  margin-right: 0;
  /* 箭头距离菜单右侧的距离 */
  right: 20px;
}
/* ==================== 子菜单展开箭头结束 ==================== */

/* ==================== 侧边栏折叠态开始 ====================
 * 控制位置：Aside 折叠到 64px 时的 el-menu--collapse 状态。
 * 修改这里会影响：折叠后的菜单宽度、图标居中、tooltip 触发层对齐、展开箭头是否显示。
 * 不影响：折叠后鼠标悬浮出现的弹出层，弹出层样式在下面非 scoped 区域。
 */
.el-menu--collapse {
  /* 折叠侧边栏内菜单宽度，需要和 Aside 折叠宽度保持一致 */
  width: 64px;

  /* 折叠时每行菜单内容居中，去掉展开态缩进 */
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

  /* 折叠时去掉图标左右外边距，否则图标不会在 64px 宽度内完全居中 */
  :deep(.el-menu-item .el-icon),
  :deep(.el-sub-menu__title .el-icon) {
    margin-right: 0;
    margin-left: 0;
  }

  /* 折叠后父级菜单不显示右侧展开箭头，只保留图标；子菜单通过悬浮弹出 */
  :deep(.el-sub-menu__icon-arrow) {
    display: none;
  }
}
/* ==================== 侧边栏折叠态结束 ==================== */

/* ==================== 通用选中态开始 ====================
 * 控制位置：所有主题下的叶子菜单选中项 .el-menu-item.is-active。
 * 修改这里会影响：浅色侧边栏、深色侧边栏、夜间模式共同继承的选中底色和右侧竖线。
 * 说明：深色侧边栏和夜间模式会在各自区块里覆盖 background-color，但右侧蓝色竖线仍来自这里。
 */
:deep(.el-menu-item.is-active) {
  background-color: #409eff1a;
  border-right: 3px solid #409eff;
}
/* ==================== 通用选中态结束 ==================== */

/* ==================== 浅色侧边栏悬浮态开始 ====================
 * 控制位置：非深色、非夜间模式下的菜单 hover 效果。
 * 包含：叶子菜单 .el-menu-item:hover，以及父级菜单标题 .el-sub-menu__title:hover。
 * 修改这里会影响：鼠标移入浅色侧边栏菜单行时的背景色。
 */
:deep(.el-menu-item:not(.is-active):hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #f5f7fa !important;
  //color: rgba(0, 0, 0, 0.85) !important;
}
/* ==================== 浅色侧边栏悬浮态结束 ==================== */

/* ==================== 深色侧边栏配置开始 ====================
 * 启用条件：template 中 el-menu 的 class 包含 is-menu-dark。
 * class 来源：props.dark 为 true，当前由 Aside 传入 settingsStore.sidebarDark && !settingsStore.isDark。
 * 也就是说：用户开启“侧边栏深色”，并且不是系统夜间模式时，才走这里。
 *
 * 这里控制的内容：
 * 1. --bee-menu-child-bg：二级、三级等内嵌展开子菜单的背景色。
 * 2. .el-menu-item.is-active：深色侧边栏下选中菜单的背景色。
 * 3. hover 选择器：深色侧边栏下叶子菜单、父级菜单标题、内嵌子菜单的悬浮背景色。
 *
 * 不在这里控制的内容：
 * 1. 侧边栏最外层背景在 Aside/index.vue 的 .aside-wrap.is-navy。
 * 2. el-menu 根背景来自 script 中 darkColors.background，并通过 :background-color 传给 Element Plus。
 * 3. 选中文字颜色来自 el-menu 的 :active-text-color="darkColors.activeTextColor"。
 * 4. 右侧 3px 蓝色竖线来自上面的“通用选中态”。
 */
.is-menu-dark {
  /* 深色侧边栏下，内嵌展开子菜单的背景色 */
  --bee-menu-child-bg: rgb(26, 31, 46);

  /* 深色侧边栏下，当前选中叶子菜单的背景色覆盖 */
  :deep(.el-menu-item.is-active) {
    background-color: var(--current-color-dark-bg, rgba(64, 158, 255, 0.2)) !important;
  }

  /* 深色侧边栏下，一级菜单、父级菜单标题、内嵌子菜单 hover 时的背景色 */
  :deep(.el-menu-item:not(.is-active):hover),
  :deep(.el-sub-menu__title:hover),
  :deep(.el-menu--inline .el-menu-item:not(.is-active):hover),
  :deep(.el-menu--inline .el-sub-menu__title:hover) {
    background-color: hsl(205 55% 49% / 0.28) !important;
    //color: rgba(0, 0, 0, 0.85) !important;
  }
}
/* ==================== 深色侧边栏配置结束 ==================== */

/* ==================== 系统夜间模式菜单配置开始 ====================
 * 启用条件：template 中 el-menu 的 class 包含 is-menu-night。
 * class 来源：settingsStore.isDark 为 true，也就是全局 html.dark / Element Plus 暗黑主题开启时。
 *
 * 这里控制的内容：
 * 1. --bee-menu-child-bg：夜间模式下内嵌展开子菜单背景。
 * 2. 选中菜单：使用主题主色作为背景，并把文字改为白色。
 * 3. 悬浮菜单：使用更深的夜间背景色，并把文字改为浅灰色。
 *
 * 设计约束：这里只改颜色，不改菜单高度、宽度、间距、缩进，避免夜间模式切换时布局跳动。
 */
.is-menu-night {
  /* 夜间模式下，内嵌展开子菜单使用 Element Plus 暗黑填充色 */
  --bee-menu-child-bg: var(--el-fill-color);

  /* 夜间模式下，当前选中叶子菜单的背景和文字颜色 */
  :deep(.el-menu-item.is-active) {
    background-color: var(--el-color-primary) !important;
    color: #fff !important;
  }

  /* 夜间模式下，叶子菜单和父级菜单标题 hover 时的背景和文字颜色 */
  :deep(.el-menu-item:not(.is-active):hover),
  :deep(.el-sub-menu__title:hover) {
    background-color: rgb(21, 25, 37) !important;
    color: #bfcbd9;
  }
}
/* ==================== 系统夜间模式菜单配置结束 ==================== */

/* ==================== 浅色内嵌子菜单悬浮态开始 ====================
 * 控制位置：浅色侧边栏中已经展开在侧边栏内部的二级、三级等子菜单 hover 效果。
 * 与上面的“浅色侧边栏悬浮态”区别：
 * - 上面主要兜底一级菜单和父级标题 hover。
 * - 这里专门加强 .el-menu--inline 内部菜单项 hover，让展开的子菜单使用浅蓝底。
 * 深色侧边栏会被 .is-menu-dark 里的更高优先级规则覆盖。
 */
:deep(.el-menu--inline .el-menu-item:not(.is-active):hover),
:deep(.el-menu--inline .el-sub-menu__title:hover) {
  background-color: #f0f5ff !important;
  //color: rgba(0, 0, 0, 0.85) !important;
}
/* ==================== 浅色内嵌子菜单悬浮态结束 ==================== */
</style>

<!-- 折叠后弹出层 teleport 到 body，必须非 scoped -->
<style lang="scss">
/* ==================== 折叠菜单弹出层样式开始 ====================
 * 这整段是非 scoped 样式，因为 Element Plus 折叠菜单的 popper 会 teleport 到 body 下。
 * 如果写在 scoped 里，Vue 的 scoped 属性选择器匹配不到 body 下的弹出层。
 *
 * 控制位置：
 * 1. 侧边栏折叠后，鼠标悬浮叶子菜单时出现的标题 tooltip。
 * 2. 侧边栏折叠后，鼠标悬浮父级菜单时出现的子菜单浮层。
 *
 * 不影响：侧边栏展开时直接显示在 Aside 内部的菜单。
 */

/* ==================== 折叠叶子菜单标题气泡开始 ====================
 * 控制位置：折叠状态下，悬浮没有子菜单的叶子菜单时出现的深色文字气泡。
 * .el-popper.is-dark 是 Element Plus tooltip 的深色皮肤。
 */
.bee-menu-popup.el-popper.is-dark {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.2;
}
/* ==================== 折叠叶子菜单标题气泡结束 ==================== */

/* ==================== 折叠父级菜单弹出外壳开始 ====================
 * 控制位置：折叠状态下，悬浮有 children 的父级菜单时出现的 popper 外壳。
 * 这里把 Element Plus 默认外壳清成透明，让真正的菜单卡片由 .el-menu--popup 负责绘制。
 */
.bee-menu-popup:has(.el-menu--popup) {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
/* ==================== 折叠父级菜单弹出外壳结束 ==================== */

/* ==================== 折叠父级菜单弹出内容开始 ====================
 * 控制位置：折叠状态下弹出的子菜单卡片，以及卡片里的菜单项、图标、箭头、选中态、悬浮态。
 * 这块只作用于 .bee-menu-popup 里的内容，不作用于侧边栏展开时的菜单。
 */
.bee-menu-popup {
  /* 弹出子菜单卡片本体：控制卡片宽度、距离侧边栏的间距、内边距、圆角、边框、背景、阴影 */
  .el-menu--popup {
    position: relative;
    min-width: 168px;
    margin-left: 8px;
    padding: 3px 6px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-overlay);
    box-shadow: var(--el-box-shadow);

    /* 弹出卡片小三角基础形状：朝向折叠侧栏图标，before 画边框，after 画背景 */
    &::before,
    &::after {
      content: "";
      position: absolute;
      top: 15px;
      width: 0;
      height: 0;
      border-style: solid;
    }

    /* 小三角外层：使用边框色，形成卡片边框延伸出来的三角边 */
    &::before {
      left: -7px;
      border-width: 7px 7px 7px 0;
      border-color: transparent var(--el-border-color-lighter) transparent transparent;
    }

    /* 小三角内层：使用卡片背景色，覆盖 before 中间区域，形成气泡箭头效果 */
    &::after {
      left: -6px;
      border-width: 6px 6px 6px 0;
      border-color: transparent var(--el-bg-color-overlay) transparent transparent;
    }
  }

  /* 弹出层在右侧居中出现时，小三角垂直居中对齐触发图标 */
  &[data-popper-placement="right"] .el-menu--popup::before,
  &[data-popper-placement="right"] .el-menu--popup::after {
    top: 50%;
    margin-top: -7px;
  }

  /* 弹出层在右下方出现时，小三角靠近卡片底部，避免箭头指向错位 */
  &[data-popper-placement="right-end"] .el-menu--popup::before,
  &[data-popper-placement="right-end"] .el-menu--popup::after {
    top: auto;
    bottom: 20px;
  }

  /* 弹出层菜单项基础尺寸：控制弹出卡片中每一行菜单的高度、内边距、圆角和文字颜色 */
  .el-menu-item,
  .el-sub-menu__title {
    height: 36px !important;
    line-height: 36px !important;
    margin: 0 !important;
    width: auto !important;
    padding: 0 20px !important;
    border-radius: 6px;
    font-weight: 400;
    color: var(--el-text-color-regular);
  }

  /* 弹出层菜单左侧图标：控制弹出卡片中业务图标的宽度、大小和与文字的距离 */
  .el-menu-item .el-icon:not(.el-sub-menu__icon-arrow),
  .el-sub-menu__title .el-icon:not(.el-sub-menu__icon-arrow) {
    width: 18px;
    margin-right: 8px;
    font-size: 20px;
  }

  /* 弹出层子菜单箭头：控制弹出卡片中有下级菜单时右侧箭头的位置和大小 */
  .el-sub-menu__icon-arrow {
    width: 12px;
    font-size: 12px;
    margin-top: -6px;
    margin-right: 0;
    right: 10px;
  }

  /* 弹出层选中态：控制弹出卡片中当前路由对应菜单项的文字颜色和背景色 */
  .el-menu-item.is-active {
    color: var(--el-color-primary);
    background-color: #409eff1a;
  }

  /* 弹出层悬浮态：控制弹出卡片中菜单项和父级标题鼠标移入时的背景和文字颜色 */
  .el-menu-item:not(.is-active):hover,
  .el-sub-menu__title:hover {
    background-color: #f0f5ff;
    color: rgba(0, 0, 0, 0.85);
  }
}
/* ==================== 折叠父级菜单弹出内容结束 ==================== */
/* ==================== 折叠菜单弹出层样式结束 ==================== */
</style>
