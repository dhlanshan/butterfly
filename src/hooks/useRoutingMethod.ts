import pinia from "@/store/index";
import {storeToRefs} from "pinia";
import {useRouteConfigStore} from "@/store/modules/route-config";
import {findCategoryById, findPathOfParentNode} from "@/utils/other";
import router from "@/router/index";

/**
 * 路由处理hooks，内置多种路由处理场景
 * @returns 路由方法
 */
export const useRoutingMethod = () => {
    /**
     * 从一维路由中查找路由
     * @param {string} path 路由的path
     * @returns 查找到的路由，undefined则表示未找到
     */
    const findLinearArray = (path: string) => {
        const routerStore = useRouteConfigStore(pinia);
        const {routeTree} = storeToRefs(routerStore);
        return findCategoryById(routeTree.value, "path", path);
    };

    /**
     * 根据当前路由找到所有直属父级路由
     * @param {string} path 路由的path
     * @returns 查找到的所有父级路由，未找到则null
     */
    const getAllParentRoute = (path: string) => {
        const routerStore = useRouteConfigStore(pinia);
        const {routeTree} = storeToRefs(routerStore);
        return findPathOfParentNode(routeTree.value, "path", path);
    };

    /**
     * 从一维路由中判断路由是否存在
     * @param {string} key 路由的name
     * @returns 路由是否存在，true存在 false不存在
     */
    const hasRoute = (key: string) => {
        const routerStore = useRouteConfigStore(pinia);
        const {routeList} = storeToRefs(routerStore);
        return routeList.value.some((item: Menu.MenuOptions) => item.name == key);
    };


    /**
     * 菜单点击统一分流（替代 el-menu 的 :router=true 自动导航）。
     *
     * 三种形态：
     * - 纯外链（meta.link 非空 && meta.iframe=false）：window.open 新标签页打开，
     *   不进系统路由、不开标签页、不改变当前页。
     * - iframe 内嵌外链（meta.link 非空 && meta.iframe=true）：正常 router.push，
     *   由 Main 内容区根据 meta 渲染 <iframe>。
     * - 内部页（无 link）：正常 router.push。
     *
     * 性能：菜单点击是低频用户操作，routeList 已是扁平数组，O(N) 线性查找即可，
     * 无需对每个点击递归搜索路由树。
     *
     * @param index 被点击菜单项的 index（即目标 path；mix 模式目录项为首个叶子 path）
     */
    const handleMenuSelect = (index: string) => {
        const routerStore = useRouteConfigStore(pinia);
        const {routeList} = storeToRefs(routerStore);
        const item = routeList.value.find((it: any) => it.path === index);
        const meta = item?.meta;
        // 纯外链：新标签页打开，不导航
        if (meta?.link && !meta.iframe) {
            window.open(meta.link as string, "_blank");
            return;
        }
        // 内部页 / iframe 内嵌：正常导航
        router.push(index);
    };

    /**
     * 检测是否是动态匹配路由，如果是动态匹配路由，则path必然带有"/:"字样，例如：/user/:id
     * @param {string} path 路由path
     * @returns 是否是动态匹配路由
     */
    const isDynamicRoute = (path: string) => {
        return path.includes("/:");
    };

    return {
        findLinearArray,
        getAllParentRoute,
        handleMenuSelect,
        isDynamicRoute,
        hasRoute
    };
};
