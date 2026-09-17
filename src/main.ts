import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
// 组件按需由 unplugin-vue-components + ElementPlusResolver 引入，不再全量 app.use(ElementPlus)。
// 脚本里手写的 ElMessage / ElMessageBox 不会走组件 Resolver，样式在此补一次。
import "element-plus/es/components/message/style/css"
import "element-plus/es/components/message-box/style/css"
// 暗黑主题 CSS 变量（配合 html.dark class 生效）
import "element-plus/theme-chalk/dark/css-vars.css"

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
app.use(pinia);
app.use(i18n);

// 初始化暗黑模式：根据持久化的 isDark 给 html 加 dark class
const settingsStore = useSettingsStoreHook();
document.documentElement.classList.toggle("dark", settingsStore.isDark);

// 立即挂载应用，不等待非关键依赖加载
app.mount("#app");