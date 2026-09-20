<script setup lang="ts">
/**
 * 主内容区
 * - 包裹 RouterView 用 <transition> 实现页面切换动画。
 * - 动画名称由 settingsStore.pageTransition 决定（light / card / fade），
 *   对应 CSS 在 style/index.scss 中定义（用 animation + both）。
 * - 水印不放在这里（放在 router-view 内部会随路由切换被 MutationObserver 误删），
 *   水印由全局 fixed 遮罩组件 BWatermark 负责（见 defaultLayout）。
 *
 * 关键点（与示例项目 ginfast-ui 一致 + 兼容裸文本页面）：
 * 1) 路由组件是异步的（`() => import(...)`）。用 createComponentWrapper 把每个路由的
 *    异步组件包进一个「同步」的 defineComponent 包装器，name = route.fullPath（与缓存名单一致），
 *    <transition> 只负责这个同步包装器的进出，异步加载发生在包装器内部 render。
 * 2) 套 <keep-alive :include="cacheRoutes">：缓存名单只含「meta.keepAlive === true」的已打开
 *    标签页 fullPath。keepAlive=true 的页切走保留状态、切回从缓存恢复（不重新挂载），
 *    避免「切回去空白」；keepAlive=false 的页切走即销毁、切回重新挂载（重新走 setup/onMounted）。
 * 3) ★包装器 render 返回一个包裹 div（h('div', ..., h(component))），保证 <transition>
 *    始终有一个根 DOM 元素可挂载过渡 class。否则当页面模板是裸文本（如 <template>你好</template>）
 *    编译成文本节点、无根元素时，过渡 leave/enter 无法挂载，mode="out-in" 下会卡死 → 空白。
 * 4) :key 用 route.fullPath + routeReloadKey，路由变化或「重新加载」时强制重挂载。
 */
import {defineComponent, h, type Component as VueComponent} from "vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useTabsStoreHook} from "@/store/modules/tabs.ts";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {storeToRefs} from "pinia";
import {findCategoryById} from "@/utils/other.ts";

const settingsStore = useSettingsStoreHook();
const tabsStore = useTabsStoreHook();
const routeStore = useRouteConfigStoreHook();
const {tabs} = storeToRefs(tabsStore);
const {routeTree} = storeToRefs(routeStore);

// pageTransition -> transition name 映射
const transitionName = computed(() => `page-trans-${settingsStore.pageTransition}`);

/**
 * keep-alive 缓存名单：已打开标签页中「meta.keepAlive === true」的那些 fullPath。
 * - 只有 meta.keepAlive 为 true 的页面才会被缓存（切走保留状态、切回不重新挂载）；
 *   keepAlive 为 false 的页面切走即销毁、切回重新挂载（重新走 setup/onMounted）。
 * - 进入新页面 -> tabs 新增；若其 meta.keepAlive 为 true -> 名单新增 -> 开始缓存。
 * - 关闭标签 -> tabs 移除 -> 名单移除 -> keep-alive 自动销毁对应缓存。
 * - 通过 routeTree 按 path 查找该 tab 对应路由节点，取其 meta.keepAlive 判断。
 * 包装器 name 与此名单中的 fullPath 一一对应，keep-alive 按 name 匹配。
 */
const cacheRoutes = computed<string[]>(() =>
    tabs.value
        .filter(t => {
            // 从路由树按 path 查找该标签对应的路由节点，取 meta.keepAlive
            const node = findCategoryById(routeTree.value, "path", t.path);
            return !!node?.meta?.keepAlive;
        })
        .map(t => t.fullPath)
);

/**
 * 为每个路由创建（并缓存）一个同步包装器组件。
 * - name = route.fullPath，用于 keep-alive :include 匹配。
 * - render 分两种：
 *   ① iframe 内嵌外链（meta.link && meta.iframe）：渲染包裹 div 内的 <iframe>，
 *     src 取 meta.link（百度等外部站点内嵌展示）。
 *   ② 普通页：渲染包裹 div 内的原始异步路由组件。
 *   两种都套一层包裹 div，给 <transition> 提供稳定根 DOM 元素（兼容裸文本页面），
 *   异步加载发生在 div 内部，不影响外层过渡触发。
 */
const wrapperCache = new Map<string, VueComponent>();

function createComponentWrapper(component: unknown, route: { fullPath: string; meta?: any }): VueComponent {
  const key = route.fullPath;
  const cached = wrapperCache.get(key);
  if (cached) return cached;

  const isIframe = !!route.meta?.link && !!route.meta?.iframe;
  const wrapper = defineComponent({
    name: key,
    render() {
      if (isIframe) {
        // iframe 内嵌：src 绑定 meta.link，class 控制铺满内容区
        return h("div", { class: "page-transition-wrap" }, h("iframe", {
          class: "iframe-page",
          src: route.meta!.link as string,
        }));
      }
      return h("div", { class: "page-transition-wrap" }, h(component as VueComponent));
    },
  });

  wrapperCache.set(key, wrapper);
  return wrapper;
}
</script>

<template>
  <el-main class="main">
    <router-view v-slot="{ Component, route }">
      <transition :name="transitionName" mode="out-in" appear>
        <keep-alive :include="cacheRoutes">
          <component
              :is="createComponentWrapper(Component, route)"
              :key="`${route.fullPath}__${settingsStore.routeReloadKey}`"
          />
        </keep-alive>
      </transition>
    </router-view>
  </el-main>
</template>

<style scoped lang="scss">
/* ==================== 主内容滚动区域开始 ====================
 * 控制位置：右侧内容区的 <el-main class="main">。
 * 它位于 Header / Tabs 下方、Footer 上方，用来承载 router-view 页面内容。
 *
 * 修改这里会影响：
 * - 主内容是否占满剩余高度。
 * - 页面滚动条出现在哪里。
 * - 主内容背景色。
 */
.main {
  /* 在右侧纵向 el-container 中占满 Header、Tabs、Footer 之外的剩余空间 */
  flex: 1;
  /* 配合 flex:1 允许内容区在 flex 容器内正确收缩，否则内部滚动可能失效 */
  height: 0;
  /* 页面内容超出时，只让主内容区滚动，不让整个 body 滚动 */
  overflow: auto;
  /* 主内容页背景色，跟随 Element Plus 浅色/暗黑主题变量 */
  background-color: var(--el-bg-color-page);
}
/* ==================== 主内容滚动区域结束 ==================== */

/* ==================== 页面过渡包裹层开始 ====================
 * 控制位置：createComponentWrapper 里给每个路由页面外层包的 .page-transition-wrap。
 * 修改这里会影响：路由页面切换动画的根节点高度，以及裸文本页面是否能稳定参与 transition。
 */
.page-transition-wrap {
  /* 让路由页面最少撑满主内容高度，避免短页面背景断层 */
  min-height: 100%;
}
/* ==================== 页面过渡包裹层结束 ==================== */

/* ==================== iframe 内嵌页面开始 ====================
 * 控制位置：meta.link + meta.iframe 的路由页面，也就是在主内容区内嵌外部链接时的 iframe。
 * 修改这里会影响：iframe 是否铺满主内容区、最小高度、边框显示。
 */
.iframe-page {
  /* 横向铺满主内容区 */
  width: 100%;
  /* 高度继承父级包裹层 */
  height: 100%;
  /* 兜底最小高度，避免 iframe 在内容很少时高度过低 */
  min-height: calc(100vh - 120px);
  /* 去掉浏览器默认 iframe 边框 */
  border: 0;
  /* 块级显示，避免 inline iframe 底部出现基线空隙 */
  display: block;
}
/* ==================== iframe 内嵌页面结束 ==================== */
</style>
