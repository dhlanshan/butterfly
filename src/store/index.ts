import {createPinia} from "pinia";
//将 Pinia 中的状态持久化存储到浏览器的本地存储
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";


const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export default pinia;