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
 * 2) 套 <keep-alive :include="cacheRoutes">：已打开标签页的 fullPath 作为缓存名单，
 *    切换回去时直接从缓存恢复（不重新挂载、不重新异步加载），避免「切回去空白」。
 * 3) ★包装器 render 返回一个包裹 div（h('div', ..., h(component))），保证 <transition>
 *    始终有一个根 DOM 元素可挂载过渡 class。否则当页面模板是裸文本（如 <template>你好</template>）
 *    编译成文本节点、无根元素时，过渡 leave/enter 无法挂载，mode="out-in" 下会卡死 → 空白。
 * 4) :key 用 route.fullPath + routeReloadKey，路由变化或「重新加载」时强制重挂载。
 */
import {defineComponent, h, type Component as VueComponent} from "vue";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
import {useTabsStoreHook} from "@/store/modules/tabs.ts";
import {storeToRefs} from "pinia";

const settingsStore = useSettingsStoreHook();
const tabsStore = useTabsStoreHook();
const {tabs} = storeToRefs(tabsStore);

// pageTransition -> transition name 映射
const transitionName = computed(() => `page-trans-${settingsStore.pageTransition}`);

/**
 * keep-alive 缓存名单：当前所有已打开标签页的 fullPath。
 * - 进入新页面 -> tabs 新增 -> 名单新增 -> keep-alive 开始缓存该包装器。
 * - 关闭标签 -> tabs 移除 -> 名单移除 -> keep-alive 自动销毁对应缓存。
 * 包装器 name 与此名单中的 fullPath 一一对应，keep-alive 按 name 匹配。
 */
const cacheRoutes = computed<string[]>(() => tabs.value.map(t => t.fullPath));

/**
 * 为每个路由创建（并缓存）一个同步包装器组件。
 * - name = route.fullPath，用于 keep-alive :include 匹配。
 * - render 返回一个包裹 div，内部渲染原始异步路由组件：
 *   ① 给 <transition> 提供稳定的根 DOM 元素（兼容裸文本页面）；
 *   ② 异步加载发生在 div 内部，不影响外层过渡触发。
 */
const wrapperCache = new Map<string, VueComponent>();

function createComponentWrapper(component: unknown, route: { fullPath: string }): VueComponent {
  const key = route.fullPath;
  const cached = wrapperCache.get(key);
  if (cached) return cached;

  const wrapper = defineComponent({
    name: key,
    render() {
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
.main {
  flex: 1;
  height: 0;
  overflow: auto;
  background-color: var(--el-bg-color-page);
}

/* 过渡包裹层：块级、最小高度撑满，避免裸文本页面无根元素导致过渡卡死 */
.page-transition-wrap {
  min-height: 100%;
}
</style>
