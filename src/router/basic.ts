import type {RouteRecordRaw} from "vue-router";
import type {ConvertedRouteItem} from "@/router/types.ts";

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

// 自定义静态路由
/**
 * 自定义静态路由（本地定义、不依赖后端菜单接口）。
 *
 * 设计说明：
 * - 使用 ConvertedRouteItem 结构（与后端动态路由转换后的结构一致），这样菜单、标签栏、
 *   面包屑、keep-alive 缓存等逻辑零改动即可识别。
 * - 在 route-config.ts 的 initSetRouter 中与后端路由「合并 + 按 meta.sort 混排」后统一走
 *   moduleReplacement（解析 component 路径字符串）-> addRoute -> routeTree 流程，
 *   因此自定义路由与后端路由行为完全一致。
 * - id 使用 9000+ 段，parentId=0 表示顶层，避免与后端菜单 id 冲突。
 * - component 用路径字符串（如 "license/license"），由 moduleMatch 解析成
 *   () => import("@/views/license/license.vue")，需保证对应 views 文件存在。
 * - roles/permission 留空，表示所有登录用户可见可访问（绕过后端角色过滤）。
 *
 * 新增自定义页面步骤：
 *   1) 在此数组追加一项（参考下方「许可列表」示例）；
 *   2) 在 src/views 下创建对应组件文件（路径与 component 字段对应）；
 *   3) 在 src/lang/modules/zhCN.ts、enUS.ts 的 menu 下补同名 i18n key。
 */
export const customStaticRoutes: ConvertedRouteItem[] = [
    // 示例：「许可列表」菜单页
    {
        id: 9001,
        parentId: 0,
        path: "/license",
        name: "license",
        // 路径字符串，由 moduleMatch 解析为 () => import("@/views/license/license.vue")
        component: "license/license",
        redirect: "",
        meta: {
            title: "license",        // i18n key，渲染时 $t('menu.license')
            hide: false,             // 是否在菜单中隐藏（false=显示）
            disable: false,          // 是否禁用
            keepAlive: true,         // 是否缓存
            affix: false,            // 是否固定标签
            link: "",                // 外链 URL（无则留空）
            iframe: false,           // 是否 iframe 内嵌
            isFull: false,           // 是否全屏路由（不套 layout）
            roles: [],               // 角色限制（空=所有登录用户）
            permission: "",          // 按钮级权限码（无则留空）
            svgIcon: "more",         // 自定义 SVG 图标名
            icon: "Document",        // Element Plus 图标名
            sort: 50,                // 排序值，与后端菜单混排时按此排序（小靠前）
            type: 2,                 // 1=目录 2=菜单/页面
        },
        children: null,
    },
];
