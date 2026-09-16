import {createRouter, createWebHistory} from "vue-router";
import {staticRoutes, notFoundAndNoPower} from "./basic"
import {hasRefreshToken} from "@/utils/auto.ts";
import {useRouteConfigStoreHook} from "@/store/modules/route-config.ts";
import {storeToRefs} from "pinia";
import {useUserStoreHook} from "@/store/modules/user.ts";
import {watch} from "vue";

/**
 * 创建vue的路由示例
 * @method createRouter(options: RouterOptions): Router
 * @link 参考：https://next.router.vuejs.org/zh/api/#createrouter
 */
const router = createRouter({
    history: createWebHistory(),
    routes: [...staticRoutes, ...notFoundAndNoPower]
});

/* ========================================================================== */
/*                              常量 / 状态                                     */
/* ========================================================================== */

/** 首页路径常量，避免在守卫里硬编码 "/home" */
const HOME_PATH = "/home";

/**
 * 错误页路由 name 白名单：
 * - "no-access"  -> /401 无权限
 * - "no-network" -> /500 网络异常
 * 这些路由无需登录、无需动态路由初始化，命中直接放行。
 * 关键作用：动态路由初始化失败时若跳 /401，/401 又会触发守卫，若它也走初始化逻辑
 * 就会「初始化失败 → /401 → 再初始化 → 再失败 → /401」死循环。白名单切断这个循环。
 *
 * 注意：不要把兜底 404（name "not-found"，path "/:path(.*)*"）放进白名单！
 * 因为动态路由在 addRoute 之前，任何尚未注册的合法路径（如首次访问 /home）都会先匹配到
 * 这个兜底路由，导致 to.name === "not-found"。若它被白名单放行，就会跳过动态路由初始化、
 * 直接显示 404。404 兜底页不需要白名单：初始化失败时只会跳 /401、/500，不会跳 404，
 * 因此不会产生死循环；而正常访问 404 时走完初始化后 isRouterReady=true 自然放行即可。
 */
const ERROR_ROUTE_NAMES = ["no-access", "no-network"];

/**
 * 动态路由是否已初始化的标志。
 * 用独立布尔标志而非 routeTree.length 判断：
 * - routeTree 为空可能是「还没初始化」，也可能是「初始化成功但用户没有任何菜单权限」，
 *   用 length 判断会把后者误判为初始化失败、每次导航都重新拉接口。
 * - 用 isRouterReady 区分：false=未初始化（需拉取），true=已初始化（无论是否有菜单都不再重复拉取）。
 * 页面刷新会重新执行本模块，isRouterReady 重置为 false，符合「刷新后需重新初始化动态路由」的预期。
 */
let isRouterReady = false;

/**
 * 监听用户 id：登出时 userStore.logout() 会把 account.id 置 0（但不会清空 routeTree、
 * 也不会移除已 addRoute 的动态路由）。此时需重置 isRouterReady，确保换账号重新登录后
 * 重新拉取该账号的动态路由/菜单，避免看到上一个账号的菜单。
 */
watch(
    () => useUserStoreHook().account.id,
    (id) => {
        if (!id) isRouterReady = false;
    }
);

/* ========================================================================== */
/*                              全局前置守卫                                    */
/* ========================================================================== */
/**
 * 路由加载前守卫，职责：
 * 1. 错误页白名单放行（避免初始化失败死循环）；
 * 2. 登录态校验：未登录跳登录页（带 redirect 回跳），已登录访问登录页跳首页；
 * 3. 首次/刷新后初始化动态路由（拉用户信息 + 菜单并 addRoute），完成后重新导航以重新匹配；
 * 4. 初始化异常时区分 401（token 失效登出）与其他错误（跳 500）。
 *
 * 注意：
 * - 全局 routeTree 不能持久化缓存，页面刷新后动态路由失效，需重新初始化。
 */
router.beforeEach(async (to) => {
    /* 1. 错误页白名单：直接放行，不参与登录与初始化判断 */
    if (ERROR_ROUTE_NAMES.includes(to.name as string)) return true;

    /* 2. 登录态判断 */
    const tokenExist = hasRefreshToken();

    // 登录页：已登录 → 跳首页；未登录 → 放行到登录页（用 name 判断比 path 更稳）
    if (to.name === "login") {
        return tokenExist ? HOME_PATH : true;
    }

    // 非登录页且无 token → 跳登录页，并带上 redirect 以便登录后回跳到原页面
    if (!tokenExist) {
        return { path: "/login", query: { redirect: to.fullPath } };
    }

    /* 3. 已登录：首次/刷新后需初始化动态路由（isRouterReady=false 时） */
    const routeStore = useRouteConfigStoreHook();
    const {routeTree} = storeToRefs(routeStore);
    if (!isRouterReady) {
        try {
            // 并行拉取用户信息与菜单路由（菜单接口自带 token，不依赖 getUserInfo 返回值，故可并行）
            await Promise.all([useUserStoreHook().getUserInfo(), routeStore.initSetRouter()]);
            // 无论是否有菜单，都算初始化完成，避免无权限用户每次导航都重复拉接口
            isRouterReady = true;
            // 初始化成功但用户无任何菜单权限 → 跳 401（已在白名单，不会再触发死循环）
            if (!routeTree.value.length) {
                return "/401";
            }
            // 动态路由 addRoute 完成后，当前 to 仍是旧匹配结果，需重新导航一次让路由重新匹配。
            // 返回 fullPath（字符串）会触发一次新的导航，此时 isRouterReady=true 直接放行，不再重复初始化。
            // 用 fullPath 比按 isDynamicRoute 分支返回 {name,params}/{path,query} 更通用，能自然兼容动态参数路由。
            return to.fullPath;
        } catch (error: any) {
            console.error("路由初始化失败:", error);
            // 401：token 失效，登出并跳登录页；其他错误（网络/5xx）跳 500，避免临时故障把用户踢下线
            const status = error?.response?.status ?? error?.code;
            if (status === 401) {
                await useUserStoreHook().logout();
                return "/login";
            }
            return "/500";
        }
    }

    /* 4. 已初始化过，直接放行 */
    return true;
});

export default router