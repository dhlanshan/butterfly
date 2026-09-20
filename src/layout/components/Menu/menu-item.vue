<script setup lang="ts">
import MenuItem from "@/layout/components/Menu/menu-item.vue";
import MenuIcon from "@/layout/components/Menu/menu-icon.vue";
import {useMenuMethod} from "@/hooks/useMenuMethod.ts";
defineOptions({ name: "MenuItem", inheritAttrs: false });

interface Props {
  routeTree: Menu.MenuOptions[];
  /** 嵌套层级：侧栏顶级为 0，每深入一层 +1，用来给子菜单做左缩进 */
  level?: number;
  /** 侧栏折叠时弹出层不再做层级缩进 */
  collapse?: boolean;
}

const { menuShow, aMenuShow } = useMenuMethod();
const props = withDefaults(defineProps<Props>(), {
  routeTree: () => [],
  level: 0,
  collapse: false,
});

/** 与父级同一套左右 margin；每层只把内容右移 15px（折叠弹出层除外） */
const padLeft = computed(() =>
  `${20 + (props.collapse ? 0 : props.level) * 20}px`
);

</script>

<template>
  <!--
    ==================== 递归菜单渲染开始 ====================
    控制位置：侧边栏菜单树的递归渲染节点。
    渲染规则：
    1. menuShow(item) 为 true：说明当前项有可展示子级，渲染 el-sub-menu。
    2. aMenuShow(item) 为 true：说明当前项是可展示叶子菜单，渲染 el-menu-item。
    3. 每深入一层 level + 1，并通过 --bee-menu-pad / paddingLeft 控制缩进。
    修改这里会影响：菜单树层级、父子菜单显示规则、菜单项点击导航 index。
  -->
  <template v-for="item in props.routeTree" :key="item.path">
    <!--
      ==================== 父级菜单项开始 ====================
      控制位置：有 children 的菜单项，对应 Element Plus 的 el-sub-menu。
      :index 使用路由 path，供 Element Plus 管理展开状态。
      :style 写入 --bee-menu-pad，Menu/index.vue 里读取该变量控制父级标题缩进。
    -->
    <el-sub-menu
        v-if="menuShow(item)"
        :index="item.path"
        :style="{ '--bee-menu-pad': padLeft }"
    >
      <template #title>
        <MenuIcon :svg-icon="item.meta.svgIcon" :icon="item.meta.icon" />
        <span>{{ $t(`menu.${item.meta.title}`) }}</span>
      </template>
      <MenuItem
          :route-tree="item.children || []"
          :level="props.level + 1"
          :collapse="props.collapse"
      />
    </el-sub-menu>
    <!-- ==================== 父级菜单项结束 ==================== -->

    <!--
      ==================== 叶子菜单项开始 ====================
      控制位置：没有可展示 children、可以直接点击跳转的菜单项。
      :index 使用路由 path，点击后会触发外层 el-menu 的 @select，再交给 useRoutingMethod 处理跳转。
      :disabled 为 true 时由 Element Plus 灰显，并且不会触发选择导航。
      :style 写入 paddingLeft，让叶子菜单和父级标题保持同一套层级缩进。
    -->
    <el-menu-item
        v-else-if="aMenuShow(item)"
        :index="item.path"
        :disabled="!!item.meta.disable"
        :style="{ paddingLeft: padLeft }"
    >
      <MenuIcon :svg-icon="item.meta.svgIcon" :icon="item.meta.icon" />
      <template #title>
        <span>{{ $t(`menu.${item.meta.title}`) }}</span>
      </template>
    </el-menu-item>
    <!-- ==================== 叶子菜单项结束 ==================== -->
  </template>
  <!-- ==================== 递归菜单渲染结束 ==================== -->
</template>
