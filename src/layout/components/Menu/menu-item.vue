<script setup lang="ts">
import MenuItem from "@/layout/components/Menu/menu-item.vue";
import MenuIcon from "@/layout/components/Menu/menu-icon.vue";
import {useMenuMethod} from "@/hooks/useMenuMethod.ts";
defineOptions({ name: "MenuItem", inheritAttrs: false });

interface Props {
  routeTree: Menu.MenuOptions[];
  /** 嵌套层级：侧栏顶级为 0，每深入一层 +1，用来给子菜单做左缩进 */
  level?: number;
}

const { menuShow, aMenuShow } = useMenuMethod();
const props = withDefaults(defineProps<Props>(), {
  routeTree: () => [],
  level: 0,
});

/** 与父级同一套左右 margin；每层只把内容右移 15px */
const padLeft = computed(() => `${12 + props.level * 15}px`);

</script>

<template>
  <template v-for="item in props.routeTree" :key="item.path">
    <el-sub-menu
        v-if="menuShow(item)"
        :index="item.path"
        :style="{ '--bee-menu-pad': padLeft }"
    >
      <template #title>
        <MenuIcon :svg-icon="item.meta.svgIcon" :icon="item.meta.icon" />
        <span>{{ $t(`menu.${item.meta.title}`) }}</span>
      </template>
      <MenuItem :route-tree="item.children || []" :level="props.level + 1" />
    </el-sub-menu>
    <!--
      叶子菜单（type=2）：
      - 绑定 :disabled="item.meta.disable"，禁用项灰显且不可点击（el-menu-item 原生支持）。
      - 配合 :router="true" 时，disabled 的 el-menu-item 不会触发导航，满足「禁用菜单」语义。
    -->
    <el-menu-item
        v-else-if="aMenuShow(item)"
        :index="item.path"
        :disabled="!!item.meta.disable"
        :style="{ paddingLeft: padLeft }"
    >
      <MenuIcon :svg-icon="item.meta.svgIcon" :icon="item.meta.icon" />
      <span>{{ $t(`menu.${item.meta.title}`) }}</span>
    </el-menu-item>
  </template>
</template>