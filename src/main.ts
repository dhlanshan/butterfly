import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Element Plus 暗黑主题 CSS 变量（配合 html.dark class 生效）
import 'element-plus/theme-chalk/dark/css-vars.css'

// pinia
import pinia from "@/store/index";
// router
import router from "@/router"

// 注册全局svg
import "virtual:svg-icons-register"
import i18n from "@/lang/index";
import {useSettingsStoreHook} from "@/store/modules/settings.ts";
// 同步加载核心依赖

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.use(pinia);
app.use(i18n);

// 初始化暗黑模式：根据持久化的 isDark 给 html 加 dark class
const settingsStore = useSettingsStoreHook();
document.documentElement.classList.toggle("dark", settingsStore.isDark);

// 立即挂载应用，不等待非关键依赖加载
app.mount("#app");