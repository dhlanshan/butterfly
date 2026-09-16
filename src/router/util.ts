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
 * 1、导入 views / plugins 下的 .vue，在模块加载时建成「相对路径 → 懒加载函数」Map。
 * 2、按 item.component 字符串 O(1) 查表，命中则替换为真实 import。
 * 3、未匹配上，不做处理。
 *
 * 路径约定：
 * - views：相对 src/views/（如 home/home → src/views/home/home.vue）
 * - plugins：相对 src/（如 plugins/foo/bar → src/plugins/foo/bar.vue，与历史 component 写法一致）
 * 用根目录标记切片，不用 split("views/")，子目录名再叫 views 也能对上。
 */
const viewModules = import.meta.glob("@/views/**/*.vue");
const pluginModules = import.meta.glob("@/plugins/**/*.vue");

const VIEW_ROOT = "/src/views/";
const SRC_ROOT = "/src/";

/**
 * 从 glob key 截出相对 root 的路径（不含 .vue）。
 * 定位完整根标记再 slice 到末尾，避免 split 在同名目录处截断。
 */
const relativeToRoot = (globKey: string, root: string): string => {
    const i = globKey.indexOf(root);
    if (i < 0) return "";
    return globKey.slice(i + root.length).replace(/\.vue$/i, "");
};

/** 启动时建表一次 O(文件数)；之后每个路由 O(1) 查，避免 O(路由数 × 文件数) 的嵌套扫描 */
const buildLoaderMap = (
    glob: Record<string, () => Promise<unknown>>,
    root: string
): Map<string, () => Promise<unknown>> => {
    const map = new Map<string, () => Promise<unknown>>();
    for (const key in glob) {
        const dir = relativeToRoot(key, root);
        if (dir) map.set(dir, glob[key]);
    }
    return map;
};

const viewLoaderMap = buildLoaderMap(viewModules, VIEW_ROOT);
const pluginLoaderMap = buildLoaderMap(pluginModules, SRC_ROOT);

export const moduleMatch = (item: any) => {
    const name = item?.component;
    // 目录型路由 component 为空，无需查表
    if (!name || typeof name !== "string") return;
    const loader = viewLoaderMap.get(name) ?? pluginLoaderMap.get(name);
    if (loader) item.component = loader;
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