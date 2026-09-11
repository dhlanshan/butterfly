import type {MenuItem} from "@/api/menu.ts";
import type {ConvertedRouteItem} from "@/router/types.ts";
import {arrayFlattened, deepClone} from "@/utils/other.ts";



/**
 * 模块替换，对路由中的模块进行转换
 * @param {array} tree 过滤角色权限后的树
 */
export const moduleReplacement = (tree: any) => {
    tree.forEach((item: any) => {
        item.children && delete item.children;
        moduleMatch(item);
    });
    return tree;
};


/**
 * 模块匹配
 * 1、导入 views 目录及其子目录下的所有 .vue 文件。
 * 2、匹配views下的所有文件路径，将模块转换为按需引入的真实模块
 * 3、未匹配上，不做处理
 */
// 匹配views里面所有的.vue文件
const modules = import.meta.glob("@/views/**/*.vue");
// 匹配插件目录下的.vue文件
const pluginModules = import.meta.glob("@/plugins/**/*.vue");

export const moduleMatch = (item: any) => {
    let matched = false;
    // 匹配每个views文件夹下的文件路径
    for (const key in modules) {
        const dir = key.split("views/")[1].replace(".vue", "");
        // 若匹配上，则替换真实模块
        if (item.component === dir) {
            // 按需引入modules
            // 将模块的导入操作和实际使用操作解耦，使得我们可以在需要的时候才执行导入操作
            item.component = () => modules[key]();
            matched = true;
            break;
        }
    }

    // 如果在主views目录中未找到，则在插件目录中查找
    if (!matched) {
        for (const key in pluginModules) {
            const dir = key.split("src/")[1].replace(".vue", "");
            // 若匹配上，则替换真实模块
            if (item.component === dir) {
                // 按需引入插件modules
                item.component = () => pluginModules[key]();
                break;
            }
        }
    }
};

/**
 * 路由树转一维数组
 * @param {array} tree 路由树
 * @returns 一维路由数组
 */
export function linearArray(tree: any) {
    const nodes: any = deepClone(tree);
    return arrayFlattened(nodes, "children");
}


/**
 * 将MenuItem数组转换为指定的路由结构函数
 * @param menuItems MenuItem数组
 * @returns 转换后的路由结构数组
 */
export const convertMenuItemsToRoutes = (menuItems: MenuItem[]): ConvertedRouteItem[] => {
    if (!menuItems || !Array.isArray(menuItems)) {
        return [];
    }
    return menuItems.map(item => {
        const convertedItem: ConvertedRouteItem = {
            // id: String(item.id),
            // parentId: String(item.parentId),
            id: item.id,
            parentId: item.parentId,
            path: item.path,
            name: item.name,
            component: item.component,
            redirect: item.redirect,
            meta: {
                title: item.title,
                hide: item.hide,
                disable: item.disable,
                keepAlive: item.keepAlive,
                affix: item.affix,
                link: item.link || "",
                iframe: item.iframe,
                isFull: item.isFull,
                roles: [], // 角色
                permission: item.permission,
                svgIcon: item.svgIcon,
                icon: item.icon,
                sort: item.sort,
                type: item.type
            },
            children: null
        };

        // 递归处理子级菜单
        if (item.children && Array.isArray(item.children) && item.children.length > 0) {
            convertedItem.children = convertMenuItemsToRoutes(item.children);
        }
        return convertedItem;
    });
};