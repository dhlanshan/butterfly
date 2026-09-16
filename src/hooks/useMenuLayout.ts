/**
 * 菜单布局相关计算工具
 *
 * 三种菜单布局模式（settingsStore.menuLayout）：
 * - side：左侧菜单（完整路由树渲染在侧边栏）
 * - top：顶部菜单（完整路由树渲染在顶部横向菜单，无侧边栏）
 * - mix：混合菜单（顶层菜单在顶部；侧边栏渲染当前顶层项的子菜单，
 *   若顶层是叶子则回显该项本身，保证首页/许可列表这类无子菜单页左侧仍有对应项）
 *
 * 这里集中处理「混合模式」下需要的路由树裁剪与激活项匹配逻辑，
 * 避免在多个组件里重复实现。
 */

/** 判断菜单项是否为叶子节点（type === 2 即可跳转的菜单） */
const isLeaf = (item: Menu.MenuOptions) => item.meta?.type === 2;

/**
 * 递归获取一个菜单项下「第一个叶子节点」的 path
 * - 用于混合模式顶部菜单：顶层目录（type 1）本身没有页面，
 *   点击时跳转到它下面第一个真实页面，保证路由可直达。
 * - 若传入的本身就是叶子，直接返回它自己的 path。
 * - 找不到叶子时回退到当前项的 path。
 */
export const getFirstLeafPath = (item: Menu.MenuOptions): string => {
    if (isLeaf(item)) return item.path;
    const children = item.children || [];
    for (const child of children) {
        const leafPath = getFirstLeafPath(child);
        if (leafPath) return leafPath;
    }
    return item.path;
};

/**
 * 判断某个路由路径是否「属于」指定的菜单项（含其后代）
 * - 用前缀匹配（以 menuPath 开头，且下一个字符是 / 或完全相等），
 *   避免 /system 与 /system-monitor 误判。
 */
const pathBelongsTo = (routePath: string, menuPath: string): boolean => {
    if (routePath === menuPath) return true;
    return routePath.startsWith(menuPath + "/");
};

/**
 * 在路由树中找到「当前路由所属的顶层菜单项」
 * - 遍历顶层节点，若当前路由命中某个顶层项（或其后代），即返回该顶层项。
 * - 用于混合模式：决定侧边栏渲染哪一棵子树。
 * - 找不到时返回 null（侧边栏留空）。
 */
export const getActiveTopItem = (
    routePath: string,
    routeTree: Menu.MenuOptions[]
): Menu.MenuOptions | null => {
    for (const top of routeTree) {
        if (pathBelongsTo(routePath, top.path)) return top;
        // 顶层项自身 path 可能不直接匹配，检查其后代是否包含当前路由
        const inDescendants = (item: Menu.MenuOptions): boolean => {
            return (item.children || []).some(
                (c: Menu.MenuOptions) => pathBelongsTo(routePath, c.path) || inDescendants(c)
            );
        };
        if (inDescendants(top)) return top;
    }
    return null;
};

/**
 * 取混合模式侧边栏要渲染的子树。
 *
 * - 顶层目录（有 children）：侧边栏只渲染其子菜单（顶部已展示该目录）。
 * - 顶层叶子（无 children，如首页、许可列表）：侧边栏回显该项本身，
 *   与示例混合菜单一致——顶部「首页」高亮的同时，左侧也有对应的「首页」菜单。
 * - 未命中顶层项：返回空数组。
 *
 * 不拷贝节点、不改原树，叶子场景只包一层数组引用，O(1)。
 */
export const getMixSubTree = (
    routePath: string,
    routeTree: Menu.MenuOptions[]
): Menu.MenuOptions[] => {
    const top = getActiveTopItem(routePath, routeTree);
    if (!top) return [];
    const children = top.children;
    if (Array.isArray(children) && children.length) return children;
    // 顶层叶子：把自身作为侧边栏唯一项
    if (isLeaf(top)) return [top];
    return [];
};

/**
 * 桌面端混合模式是否需要侧边栏。
 * 顶层目录有子菜单、或顶层叶子回显自身时都为 true；未命中路由时为 false。
 * 与 getMixSubTree 同源，避免 Aside / 折叠按钮各自再扫一遍树。
 */
export const hasMixSidebar = (
    routePath: string,
    routeTree: Menu.MenuOptions[]
): boolean => getMixSubTree(routePath, routeTree).length > 0;
