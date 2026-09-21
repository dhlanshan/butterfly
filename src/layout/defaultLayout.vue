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
        <Tabs v-if="settingsStore.showTabs"/>
        <Main />
        <Footer v-show="settingsStore.showFooter"/>
      </el-container>
    </el-container>
    <!-- 全局水印遮罩（fixed，覆盖整个视口，不随路由切换重建） -->
    <BWatermark/>
  </div>
</template>

<style scoped lang="scss">
/* ==================== 整体布局根容器开始 ====================
 * 控制位置：整个后台布局最外层 .common-layout。
 * 修改这里会影响：整个页面是否占满视口、页面级滚动条是否出现在 body 上。
 */
.common-layout {
  /* 让布局高度固定为浏览器视口高度，侧边栏、主内容、Footer 都在这个高度内计算 */
  height: 100vh;
  /* 禁止 body/外层出现滚动，滚动交给 Main 或侧边栏内部各自处理 */
  overflow: hidden;
}
/* ==================== 整体布局根容器结束 ==================== */

/* ==================== Element Plus 外层容器高度开始 ====================
 * 控制位置：.common-layout 下的第一层 el-container，也就是 Aside + 右侧内容区的横向容器。
 *
 * 为什么需要这里：
 * - side / mix 模式下 Aside 自带 100vh 高度，会自然撑起外层容器。
 * - top 模式桌面端没有 Aside，外层容器容易塌缩成内容高度。
 * - 一旦外层容器没有确定高度，Main 的 flex:1 就没有可填充空间，Footer 会被顶到上方。
 *
 * 修改这里会影响：右侧 Header、Tabs、Main、Footer 的纵向高度分配。
 */
.common-layout > .el-container {
  height: 100%;
}
/* ==================== Element Plus 外层容器高度结束 ==================== */
</style>
