import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// pinia
import pinia from "@/store/index";
// router
import router from "@/router"

// 注册全局svg
import "virtual:svg-icons-register"
import i18n from "@/lang/index";
// 同步加载核心依赖

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.use(pinia);
app.use(i18n);

// 立即挂载应用，不等待非关键依赖加载
app.mount("#app");