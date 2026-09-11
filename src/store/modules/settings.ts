import {defineStore} from "pinia";
import pinia from "@/store";

/** 触发移动端（自动折叠）的宽度阈值（px） */
const MOBILE_WIDTH = 768;

/**
 * 全局界面设置 store
 * - isCollapse：用户手动折叠状态
 * - isMobile：窗口宽度小于阈值（自动折叠）
 * - collapsed：最终是否折叠（手动 || 移动端）
 * - isDark：黑夜模式
 */
export const useSettingsStore = defineStore("settings", () => {
    const isCollapse = ref(false);
    const isDark = ref(false);
    const isMobile = ref(false);

    // 检测窗口宽度：仅在跨越阈值时自动折叠/展开，同一区间内拖动不干预手动状态
    const checkMobile = () => {
        const wasMobile = isMobile.value;
        isMobile.value = window.innerWidth < MOBILE_WIDTH;
        if (isMobile.value && !wasMobile) {
            // 桌面 → 移动：自动折叠（仅切换时一次）
            isCollapse.value = true;
        } else if (!isMobile.value && wasMobile) {
            // 移动 → 桌面：自动展开（仅切换时一次）
            isCollapse.value = false;
        }
    };

    // 仅在浏览器环境初始化一次监听
    if (typeof window !== "undefined") {
        checkMobile();
        window.addEventListener("resize", checkMobile);
    }

    // 最终折叠状态：仅跟随手动折叠状态（移动端可手动展开）
    const collapsed = computed(() => isCollapse.value);

    const toggleCollapse = () => {
        isCollapse.value = !isCollapse.value;
    };

    const toggleDark = () => {
        isDark.value = !isDark.value;
        // 切换 html 的 dark class，配合 element-plus 暗黑主题
        document.documentElement.classList.toggle("dark", isDark.value);
    };

    return {
        isCollapse,
        isDark,
        isMobile,
        collapsed,
        toggleCollapse,
        toggleDark,
    };
}, {
    // 仅持久化手动状态，isMobile 由窗口实时计算
    persist: {
        key: "bee-settings",
        pick: ["isCollapse", "isDark"],
    },
});

export function useSettingsStoreHook() {
    return useSettingsStore(pinia);
}
