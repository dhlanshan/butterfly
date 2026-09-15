import {useSettingsStoreHook} from "@/store/modules/settings.ts";

/**
 * 防调试 hook
 * 开启后：检测到 devtools 打开或 debugger 触发时，清空页面内容
 */
export const useAntiDebug = () => {
    const settingsStore = useSettingsStoreHook();
    let timer: number | null = null;
    let blocker: ((e: KeyboardEvent) => void) | null = null;
    let ctxMenuBlocker: ((e: MouseEvent) => void) | null = null;

    const disablePage = () => {
        document.body.innerHTML = "";
    };

    const start = () => {
        // 定时检测 devtools（通过 debugger 时间差）
        const check = () => {
            const start = performance.now();
            // eslint-disable-next-line no-debugger
            debugger;
            if (performance.now() - start > 100) {
                disablePage();
            }
        };
        timer = window.setInterval(check, 3000);

        // 禁用快捷键（F12 / Ctrl+Shift+I / Ctrl+U）
        blocker = (ev: KeyboardEvent) => {
            if (ev.key === "F12" ||
                (ev.ctrlKey && ev.shiftKey && (ev.key === "I" || ev.key === "i" || ev.key === "J" || ev.key === "j")) ||
                (ev.ctrlKey && (ev.key === "u" || ev.key === "U"))) {
                ev.preventDefault();
            }
        };
        document.addEventListener("keydown", blocker);

        // 禁用右键菜单
        ctxMenuBlocker = (ev: MouseEvent) => ev.preventDefault();
        document.addEventListener("contextmenu", ctxMenuBlocker);
    };

    const stop = () => {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
        if (blocker) {
            document.removeEventListener("keydown", blocker);
            blocker = null;
        }
        if (ctxMenuBlocker) {
            document.removeEventListener("contextmenu", ctxMenuBlocker);
            ctxMenuBlocker = null;
        }
    };

    // 根据 antiDebug 开关启停
    watch(
        () => settingsStore.antiDebug,
        (on) => {
            if (on) start();
            else stop();
        },
        {immediate: true}
    );
};
