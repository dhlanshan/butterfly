import type {RouteRecordRaw} from "vue-router";

// 首页地址（默认）
const HOME_PATH: string = "/home";


/**
 * 静态路由 （默认路由）
 * 此路由不要动，用于做静态路由定向，如果要添加路由，请在 `layout-children` 中添加
 * @returns 返回路由菜单数据
 */
export const staticRoutes: RouteRecordRaw[] = [
    {
        path: "/",
        redirect: HOME_PATH,
    },
    {
        path: "/login",
        name: "login",
        component: () => import("@/views/login/index.vue"),
    },
    {
        path: "/layout",
        name: "layout",
        redirect: HOME_PATH,
        component: () => import("@/layout/defaultLayout.vue"),
        children: []
    },
];


/**
 * 定义401、404、500界面
 * 401无权限
 * 404页面不存在
 * 500网络断开
 * @link 参考：https://router.vuejs.org/zh/guide/essentials/history-mode.html#netlify
 */
export const notFoundAndNoPower: RouteRecordRaw[] = [
    {
        path: "/401", // 无权限，跳转401
        name: "no-access",
        component: () => import("@/views/error/401.vue"),
    },
    {
        path: "/500", // 无网络-浏览器离线
        name: "no-network",
        component: () => import("@/views/error/500.vue"),
    },
    {
        path: "/:path(.*)*", // 匹配任意路由，兜底，未找到页面的时候跳转该页面
        name: "not-found",
        component: () => import("@/views/error/404.vue"),
    }
]