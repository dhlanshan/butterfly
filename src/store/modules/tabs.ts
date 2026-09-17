import {defineStore} from "pinia";
import pinia from "@/store";
import type {RouteLocationNormalized} from "vue-router";

export interface TabItem {
    /** 路由 path，作为唯一标识 */
    path: string;
    /** 路由 name */
    name: string;
    /** 标题（i18n key，例如 "home"） */
    title: string;
    /** 是否固定（不可关闭，例如首页） */
    affix: boolean;
    /** 完整路径（带参数） */
    fullPath: string;
}

/**
 * 标签栏 store
 * - tabs：当前打开的标签页列表
 * - activePath：当前激活的标签 path
 */
export const useTabsStore = defineStore("tabs", {
    state: () => ({
        tabs: [] as TabItem[],
        activePath: "" as string,
    }),
    getters: {
        activeIndex: (state) => state.tabs.findIndex(t => t.path === state.activePath),
    },
    actions: {
        /** 添加标签（已存在则不重复添加，并激活） */
        addTab(route: RouteLocationNormalized) {
            this.activePath = route.path;
            const exist = this.tabs.find(t => t.path === route.path);
            // 取 meta，兼容动态路由无 meta 的情况
            const meta = (route.meta || {}) as any;
            if (exist) {
                // 更新 fullPath（动态路由参数变化时）
                exist.fullPath = route.fullPath;
                // 同步最新的 meta 字段（affix / title）：
                // 这两个字段来自路由配置，路由配置变更（如改 affix）后刷新页面，
                // 已存在的标签需按最新 meta 刷新，否则会一直保留旧值（如旧 affix=true 仍固定）。
                exist.affix = !!meta.affix;
                exist.title = meta.title || exist.title;
                return;
            }
            this.tabs.push({
                path: route.path,
                name: (route.name as string) || route.path,
                title: meta.title || route.path,
                affix: !!meta.affix,
                fullPath: route.fullPath,
            });
        },
        /**
         * 用路由树批量校正「所有」已存在标签的 meta 快照（affix / title）。
         *
         * 高性能实现（O(树大小 + 标签数)）：
         * - 先把路由树「单次」迭代拍平成 Map<path, meta>（用栈迭代，避免递归栈溢出）；
         * - 再逐个标签 O(1) 查表校正，不对每个标签都递归搜索整棵树（那样是 O(标签数 × 树大小)）。
         *
         * 场景：路由配置变更（如改 affix）后刷新页面，持久化恢复出的旧标签（含非激活标签）
         * 需按最新 meta 全部刷新。routeTree 构建完成后由 Tabs 组件触发一次即可。
         * 路由树里找不到的标签（已删除/外链）保留原状，不主动关闭，避免意外行为。
         */
        reconcileWithRouteTree(routeTree: any[]) {
            if (!routeTree?.length || !this.tabs.length) return;
            // 1) 单次迭代拍平路由树 -> Map<path, meta>（栈迭代，无递归）
            const metaMap = new Map<string, any>();
            const stack: any[] = [...routeTree];
            while (stack.length) {
                const node = stack.pop();
                if (!node) continue;
                if (node.path) metaMap.set(node.path, node.meta || {});
                if (Array.isArray(node.children) && node.children.length) {
                    stack.push(...node.children);
                }
            }
            // 2) 逐个标签 O(1) 查表，按最新 meta 校正 affix / title
            this.tabs.forEach(tab => {
                const meta = metaMap.get(tab.path);
                if (!meta) return; // 路由树里找不到，保留原状
                tab.affix = !!meta.affix;
                tab.title = meta.title || tab.title;
            });
        },
        /** 关闭指定标签，返回下一个应激活的 path */
        closeTab(path: string): string | null {
            const idx = this.tabs.findIndex(t => t.path === path);
            if (idx === -1) return null;
            const tab = this.tabs[idx];
            if (tab.affix) return null; // 固定标签不可关闭
            this.tabs.splice(idx, 1);
            // 若关闭的是当前激活标签，返回相邻标签
            if (this.activePath === path) {
                const next = this.tabs[idx] || this.tabs[idx - 1] || null;
                return next ? next.path : null;
            }
            return null;
        },
        closeOther(path: string) {
            this.tabs = this.tabs.filter(t => t.affix || t.path === path);
            this.activePath = path;
        },
        closeLeft(path: string) {
            const idx = this.tabs.findIndex(t => t.path === path);
            this.tabs = this.tabs.filter((t, i) => t.affix || i >= idx);
        },
        closeRight(path: string) {
            const idx = this.tabs.findIndex(t => t.path === path);
            this.tabs = this.tabs.filter((t, i) => t.affix || i <= idx);
        },
        closeAll(): string | null {
            this.tabs = this.tabs.filter(t => t.affix);
            return this.tabs[0]?.path || null;
        },
        /**
         * 拖拽换位：把 from 处的标签挪到 to。
         * splice 各一次，O(n)；标签数很少，比引入拖拽库更轻。
         */
        moveTab(from: number, to: number) {
            if (from === to || from < 0 || to < 0) return;
            const len = this.tabs.length;
            if (from >= len || to >= len) return;
            const [item] = this.tabs.splice(from, 1);
            this.tabs.splice(to, 0, item);
        },
    },
    persist: {
        key: "bee-tabs",
        pick: ["tabs", "activePath"],
    },
});

export function useTabsStoreHook() {
    return useTabsStore(pinia);
}
