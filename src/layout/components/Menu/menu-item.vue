<script setup lang="ts">
import MenuItem from "@/layout/components/Menu/menu-item.vue";
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
        <span>{{ $t(`menu.${item.meta.title}`) }}</span>
      </template>
      <MenuItem :route-tree="item.children || []" />
    </el-sub-menu>
    <el-menu-item v-else-if="aMenuShow(item)" :index="item.path">
      <span>{{ $t(`menu.${item.meta.title}`) }}</span>
    </el-menu-item>
  </template>
</template>

<style scoped lang="scss">

</style>