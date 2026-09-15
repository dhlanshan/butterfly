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
    <!-- 全局水印遮罩（fixed，覆盖整个视口，不随路由切换重建） -->
    <BWatermark/>
  </div>
</template>

<style scoped lang="scss">
.common-layout {
  height: 100vh;
  overflow: hidden;
}

/* 外层 el-container 始终撑满 100vh：
   - side/mix 模式下 Aside 自带 100vh 高度会撑起外层容器；
   - top 模式无 Aside，外层容器会塌缩成内容高度，导致 Main 的 flex:1 无确定高度可填、
     Footer 被顶到上方。这里强制外层容器高度 100%，内层纵向容器靠 flex 默认的
     align-items: stretch 拉伸到等高，Main 即可填满剩余空间把 Footer 压到底部。 */
.common-layout > .el-container {
  height: 100%;
}
</style>
