import {defineStore} from "pinia";
import pinia from "@/store";
import router from "@/router/index";
import {getRoutersAPI} from "@/api/menu.ts";
import {convertMenuItemsToRoutes, linearArray, moduleReplacement} from "@/router/util.ts";


export const useRouteConfigStore = defineStore("routeConfig", () => {
    const routeTree = ref<any>([]); // 有访问权限的路由树
    const routeList = ref<any>([]); // 有访问权限的一维路由数组

    /**
     * 路由初始化
     * 1、获取过滤角色权限后排过序的的路由树，后端处理
     * 2、获取路由树转换的一维路由
     * 3、将模块设置为真实模块
     * 4、动态添加路由
     * 5、存储路由树，用于生成菜单
     * 6、缓存一维路由
     */
    const initSetRouter = async () => {
        // 1.获取过滤角色权限后的树
        const res = await getRoutersAPI();
        const data = convertMenuItemsToRoutes(res.data);
        // 2、获取路由树转换的一维路由
        let flatRoute = linearArray(data);
        // 3、将模块设置为真实模块
        let realTree = await moduleReplacement(flatRoute);
        // 4、动态添加路由
        realTree.forEach((route: any) => {
            if (route.meta.isFull) {
                router.addRoute(route);
            } else {
                router.addRoute("layout", route);
            }
        });
        // 5、存储路由树，用于生成菜单
        routeTree.value = data;
        // 6、缓存一维路由
        routeList.value = flatRoute;
    }

    return {initSetRouter, routeTree, routeList};
})

export function useRouteConfigStoreHook() {
    return useRouteConfigStore(pinia);
}