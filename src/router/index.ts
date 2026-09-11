import {createRouter, createWebHistory} from "vue-router";
import {staticRoutes, notFoundAndNoPower} from "./basic"
import {hasRefreshToken} from "@/utils/auto.ts";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {storeToRefs} from "pinia";
import {useUserStoreHook} from "@/store/modules/user.ts";
import {useRoutingMethod} from "@/hooks/useRoutingMethod.ts";

/**
 * 创建vue的路由示例
 * @method createRouter(options: RouterOptions): Router
 * @link 参考：https://next.router.vuejs.org/zh/api/#createrouter
 */
const router = createRouter({
    history: createWebHistory(),
    routes: [...staticRoutes, ...notFoundAndNoPower]
});

console.log("nnnnnnn",

    router.getRoutes().map(r => r.path)

)

/**
 * 路由加载前需要判断用户是否登录
 * 1、去登录页，无token，放行
 * 2、没有token，直接重定向到登录页
 * 3、去登录页，有token，直接重定向到home页
 * 4、去非登录页，有token，用户信息是否存在，有则放行，否则重新获取路由信息、初始化路由
 * 注意：
 * 全局routeTree不能持久化缓存
 * 页面刷新会导致addRoute动态添加的路由失效，需要重新初始化路由
 */
router.beforeEach(async (to) => {
    // 登录逻辑
    const tokenExist = hasRefreshToken()
    // 1.去登录页, 无token, 放行
    if (to.path === "/login" && !tokenExist) return true;
    // 2.没有token, 直接重定向到登录页
    if (!tokenExist) return "/login";
    // 3.去登录页, 有token, 直接重定向到home页
    if (to.path === "/login" && tokenExist) return "/home";

    const routeStore = useRouteConfigStoreHook()
    const { routeTree } = storeToRefs(routeStore);
    if (!routeTree.value.length) {
        try {
            // 获取用户信息、路由信息、字典数据
            await Promise.all([useUserStoreHook().getUserInfo(), routeStore.initSetRouter()]);
            if (!routeTree.value.length) {
                console.warn("路由初始化失败，routeTree为空");
                // 跳转到401页面
                return "/401";
            }
            // 判断是否是动态路由
            const { isDynamicRoute } = useRoutingMethod();
            if (isDynamicRoute(to.path)) {
                return { name: to.name, params: to.params };
            } else {
                return { path: to.path, query: to.query };
            }
        } catch (error: any) {
            console.error("获取用户信息或路由信息失败:", error);
            // 清除可能无效的token
            await useUserStoreHook().logout();
            // 重定向到登录页
            return "/login";
        }
    }

    // 动态路由添加过走这里，直接放行
    return true;

})

export default router