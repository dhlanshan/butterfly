import {defineStore} from "pinia";
import pinia from "@/store";
import {watch} from "vue";

/** 触发移动端（自动折叠）的宽度阈值（px） */
const MOBILE_WIDTH = 768;

/** 水印配置类型 */
export interface WatermarkConfig {
    enabled: boolean;
    color: string;
    text: string;
    size: number;
    angle: number;
    gap: number;
}

/** 菜单布局模式：side=左侧菜单 / top=顶部菜单 / mix=混合菜单 */
export type MenuLayout = "side" | "top" | "mix";

/** 页面过渡动画：light=轻过渡 / card=卡片 / fade=渐退 */
export type PageTransition = "light" | "card" | "fade";

/** 页签风格：smart=灵动（下划线） / card=卡片 / google=谷歌（浏览器标签） */
export type TabStyle = "smart" | "card" | "google";

/* -------------------------------------------------------------------------- */
/*                          主题色生成工具（hex 混色）                          */
/* -------------------------------------------------------------------------- */

/**
 * 将 hex 颜色按权重与另一颜色混合，返回 hex。
 * - weight 为 mixColor 占的比例（0~1）。
 * - 用于根据主色生成 Element Plus 需要的 light-N / dark-2 变体：
 *   light-N = mix(主色, 白, N/10)；dark-2 = mix(主色, 黑, 0.2)。
 */
const mixHex = (color1: string, color2: string, weight: number): string => {
    const c1 = color1.replace("#", "");
    const c2 = color2.replace("#", "");
    const r1 = parseInt(c1.substring(0, 2), 16);
    const g1 = parseInt(c1.substring(2, 4), 16);
    const b1 = parseInt(c1.substring(4, 6), 16);
    const r2 = parseInt(c2.substring(0, 2), 16);
    const g2 = parseInt(c2.substring(2, 4), 16);
    const b2 = parseInt(c2.substring(4, 6), 16);
    const r = Math.round(r1 * weight + r2 * (1 - weight));
    const g = Math.round(g1 * weight + g2 * (1 - weight));
    const b = Math.round(b1 * weight + b2 * (1 - weight));
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * 应用主题色到全局 CSS 变量：
 * - 设置 --el-color-primary 为主色
 * - 生成 light-3/5/7/8/9（与白混合，比例递增）与 dark-2（与黑混合 20%）
 *   覆盖 Element Plus 默认主题色变量，使按钮/链接/选中态等全部跟随主色。
 */
const applyThemeColor = (color: string) => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    el.style.setProperty("--el-color-primary", color);
    el.style.setProperty("--el-color-primary-light-3", mixHex(color, "#ffffff", 0.3));
    el.style.setProperty("--el-color-primary-light-5", mixHex(color, "#ffffff", 0.5));
    el.style.setProperty("--el-color-primary-light-7", mixHex(color, "#ffffff", 0.7));
    el.style.setProperty("--el-color-primary-light-8", mixHex(color, "#ffffff", 0.8));
    el.style.setProperty("--el-color-primary-light-9", mixHex(color, "#ffffff", 0.9));
    el.style.setProperty("--el-color-primary-dark-2", mixHex(color, "#000000", 0.2));
};

/**
 * 全局界面设置 store
 * - isCollapse：用户手动折叠状态
 * - isMobile：窗口宽度小于阈值（自动折叠）
 * - collapsed：最终是否折叠
 * - isDark：黑夜模式
 * - 界面设置：showBreadcrumb / showTabs / showFooter / menuAccordion
 * - 菜单布局：menuLayout
 * - 主题设置：themeColor / colorWeak / greyMode / sidebarDark / pageTransition / tabStyle
 * - 水印设置：watermark
 * - 防调试：antiDebug
 */
export const useSettingsStore = defineStore("settings", () => {
    const isCollapse = ref(false);
    const isDark = ref(false);
    const isMobile = ref(false);

    // 界面设置
    const showBreadcrumb = ref(true);
    const showTabs = ref(true);
    const showFooter = ref(false);
    const menuAccordion = ref(false);

    // 菜单布局模式
    const menuLayout = ref<MenuLayout>("side");

    // 主题设置
    // themeColor：Element Plus 主色（默认 #409eff）
    const themeColor = ref("#409eff");
    // 色弱模式：html 加 color-weak class（滤镜增强对比，辅助色觉障碍）
    const colorWeak = ref(false);
    // 灰色模式：html 加 grey-mode class（页面整体灰度）
    const greyMode = ref(false);
    // 侧边栏深色：Aside 使用深色背景 + 浅色文字
    const sidebarDark = ref(false);
    // 页面过渡动画
    const pageTransition = ref<PageTransition>("card");
    // 页签风格（仅影响 Tabs 外观，不改标签数据）
    const tabStyle = ref<TabStyle>("smart");

    // 水印设置
    const watermark = ref<WatermarkConfig>({
        enabled: false,
        color: "rgba(0, 0, 0, 0.1)",
        text: "JetBrains",
        size: 16,
        angle: -22,
        gap: 200,
    });

    // 系统设置
    const antiDebug = ref(false);

    // 路由刷新计数器：递增后 Main 里的 :key 变化，强制当前路由组件重挂载（实现「重新加载」）
    const routeReloadKey = ref(0);
    /** 重新加载当前路由（不依赖额外的 redirect 路由） */
    const reloadCurrentRoute = () => {
        routeReloadKey.value++;
    };

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

    /* ---------- 主题相关：应用 / 联动 ---------- */

    /**
     * 应用色弱 / 灰色模式：在 html 上切换对应 class，
     * 由全局 CSS（style/index.scss）提供滤镜效果。
     */
    const applyVisualModes = () => {
        if (typeof document === "undefined") return;
        const el = document.documentElement;
        el.classList.toggle("color-weak", colorWeak.value);
        el.classList.toggle("grey-mode", greyMode.value);
    };

    // 浏览器环境：初始化时应用一次主题色与视觉模式（持久化值恢复）
    if (typeof window !== "undefined") {
        applyThemeColor(themeColor.value);
        applyVisualModes();
    }

    // 主题色变化 → 实时写 CSS 变量
    watch(themeColor, (c) => applyThemeColor(c));
    // 色弱 / 灰色模式变化 → 切换 html class
    watch([colorWeak, greyMode], applyVisualModes);

    return {
        isCollapse,
        isDark,
        isMobile,
        collapsed,
        // 界面设置
        showBreadcrumb,
        showTabs,
        showFooter,
        menuAccordion,
        menuLayout,
        // 主题设置
        themeColor,
        colorWeak,
        greyMode,
        sidebarDark,
        pageTransition,
        tabStyle,
        // 水印
        watermark,
        // 系统
        antiDebug,
        // 方法
        toggleCollapse,
        toggleDark,
        reloadCurrentRoute,
        routeReloadKey,
    };
}, {
    // 仅持久化手动状态与偏好，isMobile 由窗口实时计算
    persist: {
        key: "bee-settings",
        pick: [
            "isCollapse",
            "isDark",
            "showBreadcrumb",
            "showTabs",
            "showFooter",
            "menuAccordion",
            "menuLayout",
            "themeColor",
            "colorWeak",
            "greyMode",
            "sidebarDark",
            "pageTransition",
            "tabStyle",
            "watermark",
            "antiDebug",
        ],
    },
});

export function useSettingsStoreHook() {
    return useSettingsStore(pinia);
}
