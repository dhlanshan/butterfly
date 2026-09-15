<script setup lang="ts">
import Aside from "./components/Aside/index.vue"
import Main from "./components/Main/index.vue"
import Header from "./components/Header/index.vue"
import Tabs from "./components/Tabs/index.vue"
import Footer from "./components/Footer/index.vue"
import BWatermark from "@/components/b-watermark/index.vue"
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useAntiDebug} from "@/hooks/useAntiDebug.ts";

const settingsStore = useSettingsStoreHook();
// 启用防调试（内部根据 antiDebug 开关启停）
useAntiDebug();
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!--
        侧边栏渲染规则：
        - side / mix 模式：始终渲染（桌面为常驻侧栏，移动端为抽屉）。
        - top 模式：桌面不渲染（菜单在顶部横向菜单）；移动端渲染为抽屉，
          与 side 模式保持一致的移动端体验。
      -->
      <Aside v-if="settingsStore.menuLayout !== 'top' || settingsStore.isMobile"/>
      <el-container direction="vertical">
        <Header />
        <Tabs v-show="settingsStore.showTabs"/>
        <Main />
        <Footer v-show="settingsStore.showFooter"/>
      </el-container>
    </el-container>
    <!-- 全局水印层 -->
    <BWatermark/>
  </div>
</template>

<style scoped lang="scss">
.common-layout {
  height: 100vh;
  overflow: hidden;
}
</style>
