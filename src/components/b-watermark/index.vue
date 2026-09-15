<script setup lang="ts">
/**
 * 全局水印遮罩
 *
 * 复用 Element Plus 内置 <el-watermark>（与示例项目用 Arco <a-watermark> 同源算法，
 * 均移植自 Ant Design），原生支持「错开排列」并自带 MutationObserver 防篡改。
 *
 * 关键点：
 * - 用 position: fixed 的遮罩容器铺满视口，<el-watermark> 内部容器撑满 100%，
 *   水印即可覆盖整个页面（header / 侧边栏 / 主内容都在其下）。
 * - 放在路由外层（defaultLayout 顶层），不随路由切换重建，避免切换页面后水印消失。
 * - z-index 1000 低于 Element Plus 弹出层（popper 基准 2000），
 *   抽屉/下拉/颜色面板等弹出层浮在水印之上。
 * - pointer-events: none，不拦截点击。
 *
 * 文案为空时 el-watermark 会绘制空白瓦片，无可见水印，无需 v-if 切换。
 */
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {computed} from "vue";

const settingsStore = useSettingsStoreHook();

// el-watermark 的 props 映射：把 store 中的水印配置转成组件所需格式
const watermarkProps = computed(() => {
    const wm = settingsStore.watermark;
    return {
        content: wm.text,
        font: {color: wm.color, fontSize: wm.size},
        rotate: wm.angle,
        // gap 为 [x, y] 元组，水平和垂直间隙用同一个值
        gap: [wm.gap, wm.gap] as [number, number],
    };
});
</script>

<template>
  <!-- fixed 遮罩：铺满视口、不拦截事件、层级低于弹出层 -->
  <div class="b-watermark-overlay">
    <!-- el-watermark 内部容器撑满 100%，水印 absolute 即覆盖整个视口 -->
    <el-watermark class="b-watermark-inner" v-bind="watermarkProps"/>
  </div>
</template>

<style scoped lang="scss">
.b-watermark-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
}

/* el-watermark 根容器撑满遮罩，水印层（absolute 100%）即可覆盖整个视口 */
.b-watermark-inner {
  width: 100%;
  height: 100%;
}
</style>
