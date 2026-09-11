<script setup lang="ts">
import Menu from "../Menu/index.vue"
import Logo from "../Logo/index.vue"
import {storeToRefs} from "pinia";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useRoute} from "vue-router";

const routerStore = useRouteConfigStoreHook();
const { routeTree } = storeToRefs(routerStore);
const settingsStore = useSettingsStoreHook();
const route = useRoute();

// 移动端抽屉模式下：路由切换（选中菜单）后自动折叠
watch(() => route.path, () => {
    if (settingsStore.isMobile && !settingsStore.collapsed) {
        settingsStore.isCollapse = true;
    }
});
</script>

<template>
  <!--
    桌面：正常文档流（200px / 64px）
    移动端折叠：width 0 隐藏不占位
    移动端展开：position fixed 抽屉覆盖内容
  -->
  <aside
      class="aside-wrap"
      :class="{
        'is-collapsed': !settingsStore.isMobile && settingsStore.collapsed,
        'is-hidden': settingsStore.isMobile && settingsStore.collapsed,
        'is-drawer': settingsStore.isMobile && !settingsStore.collapsed,
      }"
  >
    <div class="aside">
      <Logo />
      <div class="layout_side">
        <Menu
            :route-tree="routeTree"
            :collapse="settingsStore.collapsed && !settingsStore.isMobile"
        />
      </div>
    </div>
  </aside>

  <!-- 移动端抽屉遮罩：点击折叠 -->
  <div
      v-if="settingsStore.isMobile && !settingsStore.collapsed"
      class="aside-mask"
      @click="settingsStore.isCollapse = true"
  ></div>
</template>

<style scoped lang="scss">
.aside-wrap {
  height: 100vh;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  transition: width 0.25s ease;
  overflow: hidden;
  /* 桌面默认展开：200px */
  width: 200px;

  /* 桌面折叠：64px（仅图标） */
  &.is-collapsed {
    width: 64px;
  }

  /* 移动端折叠：隐藏不占位，内容区占满宽度 */
  &.is-hidden {
    width: 0;
    border-right: none;
  }

  /* 移动端展开：抽屉模式，悬浮覆盖内容 */
  &.is-drawer {
    position: fixed;
    top: 0;
    left: 0;
    width: 200px;
    height: 100vh;
    z-index: 1001;
    border-right: none;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
}

.aside {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.layout_side {
  flex: 1;
  overflow: hidden;
}

/* 移动端抽屉遮罩 */
.aside-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 1000;
}
</style>
