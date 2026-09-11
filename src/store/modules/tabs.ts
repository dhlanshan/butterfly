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
            if (exist) {
                // 更新 fullPath（动态路由参数变化时）
                exist.fullPath = route.fullPath;
                return;
            }
            // 取 meta.title，兼容动态路由无 meta 的情况
            const meta = (route.meta || {}) as any;
            this.tabs.push({
                path: route.path,
                name: (route.name as string) || route.path,
                title: meta.title || route.path,
                affix: !!meta.affix,
                fullPath: route.fullPath,
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
    },
    persist: {
        key: "bee-tabs",
        pick: ["tabs", "activePath"],
    },
});

export function useTabsStoreHook() {
    return useTabsStore(pinia);
}
