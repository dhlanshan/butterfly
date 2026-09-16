<script setup lang="ts">
import MenuItem from "@/layout/components/Menu/menu-item.vue";
import MenuIcon from "@/layout/components/Menu/menu-icon.vue";
import {useMenuMethod} from "@/hooks/useMenuMethod.ts";
defineOptions({ name: "MenuItem", inheritAttrs: false });

interface Props {
  routeTree: Menu.MenuOptions[];
}

const { menuShow, aMenuShow } = useMenuMethod();
const props = withDefaults(defineProps<Props>(), {
  routeTree: () => []
});

</script>

<template>
  <template v-for="item in props.routeTree" :key="item.path">
    <el-sub-menu v-if="menuShow(item)" :index="item.path">
      <template #title>
        <MenuIcon :svg-icon="item.meta.svgIcon" :icon="item.meta.icon" />
        <span>{{ $t(`menu.${item.meta.title}`) }}</span>
      </template>
      <MenuItem :route-tree="item.children || []" />
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
    >
      <MenuIcon :svg-icon="item.meta.svgIcon" :icon="item.meta.icon" />
      <span>{{ $t(`menu.${item.meta.title}`) }}</span>
    </el-menu-item>
  </template>
</template>

<style scoped lang="scss">

</style>