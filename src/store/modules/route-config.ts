import {defineStore} from "pinia";
import pinia from "@/store";
import {defineComponent, h} from "vue";
import router from "@/router/index";
import {getRoutersAPI} from "@/api/menu.ts";
import {convertMenuItemsToRoutes, linearArray, moduleReplacement} from "@/router/util.ts";
import {customStaticRoutes} from "@/router/basic.ts";

/**
 * iframe 内嵌外链的占位组件。
 * - 注册路由时 vue-router 必须有一个合法 component，但实际内容由 Main 根据 meta.link 渲染 <iframe>，
 *   所以这里只给一个空 div 占位，永远不会被真正渲染。
 * - 集中定义一处，避免散落多个内联组件。
 */
const IframePlaceholder = defineComponent({
    name: "IframePlaceholder",
    render: () => h("div"),
});


export const useRouteConfigStore = defineStore("routeConfig", () => {
    const routeTree = ref<any>([]); // 有访问权限的路由树
    const routeList = ref<any>([]); // 有访问权限的一维路由数组

    /**
     * 路由初始化
     * 1、获取过滤角色权限后排过序的的路由树，后端处理
     * 2、合并自定义静态路由（本地定义），并按 meta.sort 与后端菜单混排
     * 3、获取路由树转换的一维路由
     * 4、将模块设置为真实模块（解析 component 路径字符串）
     * 5、动态添加路由
     * 6、存储路由树，用于生成菜单
     * 7、缓存一维路由
     */
    const initSetRouter = async () => {
        // 1.获取过滤角色权限后的树
        const res = await getRoutersAPI();
        const data = convertMenuItemsToRoutes(res.data);
        // 2、合并自定义静态路由，按 meta.sort 升序混排（小靠前；缺省按 0）
        const merged = [...customStaticRoutes, ...data].sort(
            (a: any, b: any) => (a.meta?.sort ?? 0) - (b.meta?.sort ?? 0)
        );
        // 3、获取路由树转换的一维路由
        let flatRoute = linearArray(merged);
        // 4、将模块设置为真实模块
        let realTree = await moduleReplacement(flatRoute);
        // 5、动态添加路由
        realTree.forEach((route: any) => {
            // 纯外链（meta.link && !iframe）：菜单点击走 window.open，不注册路由
            if (route.meta.link && !route.meta.iframe) return;
            // iframe 内嵌外链：用占位组件注册路由，内容由 Main 内容区渲染 <iframe>
            if (route.meta.link && route.meta.iframe) {
                route.component = IframePlaceholder;
            }
            if (route.meta.isFull) {
                router.addRoute(route);
            } else {
                router.addRoute("layout", route);
            }
        });
        // 6、存储路由树，用于生成菜单（保留树形 children）
        routeTree.value = merged;
        // 7、缓存一维路由
        routeList.value = flatRoute;
    }

    return {initSetRouter, routeTree, routeList};
})

export function useRouteConfigStoreHook() {
    return useRouteConfigStore(pinia);
}