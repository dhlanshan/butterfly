<script setup lang="ts">
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {watchEffect, ref, onMounted} from "vue";

const settingsStore = useSettingsStoreHook();
// 水印容器：始终渲染（用 display 控制显隐），保证 containerRef 稳定可用
const containerRef = ref<HTMLElement | null>(null);

/**
 * 绘制水印：把文案画到 canvas，转成 data URL 作为容器背景图平铺
 * - 读取 watermark 的所有配置项（text/color/size/angle/gap）
 * - 容器未挂载或文案为空时清除背景
 */
const drawWatermark = () => {
    const wm = settingsStore.watermark;
    const container = containerRef.value;
    if (!container) return;

    // 文案为空：清除水印
    if (!wm.text) {
        container.style.backgroundImage = "";
        return;
    }

    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    const width = wm.gap;
    const height = wm.gap;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.font = `${wm.size}px Arial, "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = wm.color;          // 颜色（支持 rgba）
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(width / 2, height / 2);
    ctx.rotate((wm.angle * Math.PI) / 180);  // 角度
    ctx.fillText(wm.text, 0, 0);

    // 平铺背景图
    container.style.backgroundImage = `url(${canvas.toDataURL()})`;
    container.style.backgroundRepeat = "repeat";
};

/**
 * 实时响应水印配置变化并重绘
 * - watchEffect 会立即执行一次（flush: 'post' 推迟到 DOM 挂载后），
 *   这样刷新页面后也能自动绘制水印（修复刷新后水印消失的问题）
 * - effect 内显式解构 watermark 的每个属性，建立对 color/size/angle/gap/text
 *   的响应依赖，任一变化都会触发重绘（修复颜色不生效的问题）
 */
watchEffect(() => {
    // 显式访问各属性以建立响应依赖
    const {text, color, size, angle, gap} = settingsStore.watermark;
    void text; void color; void size; void angle; void gap;
    drawWatermark();
}, {flush: "post"});

// 挂载后兜底重绘一次（确保 containerRef 就绪时绘制）
onMounted(() => drawWatermark());
</script>

<template>
  <!-- 始终渲染容器，用 visibility 控制显隐，保证 ref 稳定 -->
  <div
      ref="containerRef"
      class="b-watermark"
      :style="{visibility: settingsStore.watermark.text ? 'visible' : 'hidden'}"
  ></div>
</template>

<style scoped lang="scss">
.b-watermark {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* z-index 低于 Element Plus 弹出层（popper 基准 2000），
     使抽屉/下拉/颜色面板等弹出层浮在水印之上，水印不覆盖这些弹出层 */
  z-index: 1000;
  pointer-events: none;
}
</style>
