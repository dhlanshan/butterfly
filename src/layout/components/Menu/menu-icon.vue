<script setup lang="ts">
/**
 * 菜单图标：svgIcon 优先于 icon。
 *
 * 优先级：
 * 1) meta.svgIcon 非空 → 项目 SVG sprite（BSvgIcon，对应 src/assets/svgs/{name}.svg）
 * 2) 否则 meta.icon 非空且能在 @element-plus/icons-vue 中命中 → Element Plus 图标
 * 3) 都空 / 名称无效 → 渲染不可见的占位 el-icon，保证同级菜单文字左对齐
 *
 * 性能：
 * - Element Plus 图标包在模块级一次性静态导入，做成 Record 查表；
 *   动态图标名来自路由配置，无法 tree-shake 单个图标，一次性导入换每次渲染 O(1) 取组件，
 *   避免运行时动态 import 造成的异步闪烁。
 * - 用 computed 缓存查表结果，同一菜单项重复 render 不重复做属性访问以外的工作。
 *
 * 包一层 <el-icon>：侧边栏折叠时 Element Plus 只保留 .el-icon 作为图标位，
 * 自定义 SVG 不包这层会在折叠态消失。color=currentColor 让图标跟随菜单文字色
 * （含深色侧边栏、选中态）。
 */
import type {Component} from "vue";
import * as ElementPlusIcons from "@element-plus/icons-vue";

const EP_ICON_MAP = ElementPlusIcons as unknown as Record<string, Component>;

interface Props {
  /** 自定义 SVG 文件名（不含 .svg），对应 src/assets/svgs/ */
  svgIcon?: string;
  /** Element Plus 图标组件名，如 Document、Setting */
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  svgIcon: "",
  icon: "",
});

const useSvg = computed(() => !!props.svgIcon);
const epIcon = computed<Component | null>(() => {
  if (useSvg.value || !props.icon) return null;
  return EP_ICON_MAP[props.icon] ?? null;
});
const hasIcon = computed(() => useSvg.value || !!epIcon.value);
</script>

<template>
  <el-icon :class="{ 'is-placeholder': !hasIcon }">
    <b-svg-icon v-if="useSvg" :name="svgIcon" size="1em" color="currentColor"/>
    <component v-else-if="epIcon" :is="epIcon"/>
  </el-icon>
</template>

<style scoped lang="scss">
/* 无图标时仍占位，同级文字才能对齐 */
.is-placeholder {
  visibility: hidden;
}
</style>
