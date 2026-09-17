import vue from "@vitejs/plugin-vue"
import {resolve} from "path";
import {createSvgIconsPlugin} from "vite-plugin-svg-icons";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import {viteMockServe} from "vite-plugin-mock";
import type {PluginOption} from "vite";
import {ElementPlusResolver} from "unplugin-vue-components/resolvers";

/** Element Plus 按需：模板 el-xxx / 脚本 ElMessage 等由 Resolver 引入组件与样式 */
const elementPlusResolver = ElementPlusResolver({importStyle: "css"});

/**
 * 创建 vite 插件
 * @param viteEnv 环境变量
 * @returns 插件列表
 */
export const createVitePlugins = (viteEnv: ViteEnv): (PluginOption | PluginOption[])[] => {
    const env = viteEnv;
    const isMockEnabled = env.VITE_APP_OPEN_MOCK === true || env.VITE_APP_OPEN_MOCK === "true";
    return [
        // 支持 Vue 3 单文件组件功能。
        vue(),

        // SVG 图标插件配置
        // 用于自动扫描 src/assets/svgs 目录下的 SVG 文件,将 SVG 图标转换为 SVG Sprite（雪碧图）并注册到页面中。
        // 使用时通过 symbolId 引用对应图标：
        // <svg>
        //     <use href="#icon-xxx" />
        // </svg>
        // 配置说明:
        // - iconDirs：指定 SVG 图标存放目录
        // - symbolId：定义生成的 SVG symbol id 规则
        //    [dir] 代表图标所在目录
        //    [name] 代表 SVG 文件名
        // 示例:
        // src/assets/svgs/user.svg
        // 会生成: #icon-user
        // src/assets/svgs/men/user.svg
        // 会生成: #icon-men-user
        createSvgIconsPlugin({
            // 配置src下存放svg的路径，这里表示在src/assets/svgs文件夹下
            iconDirs: [resolve(process.cwd(), "src/assets/svgs")],
            symbolId: "icon-[dir]-[name]"
        }),

        // 自动导入插件
        AutoImport({
            // 自动导入 Vue 相关函数
            imports: ["vue", "vue-router"],
            // 自动导入的目录: 自定义全局类型或函数
            dirs: ["src/globals"],
            // 配置文件生成位置
            dts: "src/auto-import.d.ts",
            // navite
            resolvers: [elementPlusResolver]
        }),

        // 自动导入组件
        Components({
            // 自动加载组件的目录
            dirs: ["src/components"],
            // 组件的有效文件扩展名
            extensions: ["vue"],
            // 配置文件生成位置
            dts: "src/auto-components.d.ts",
            // navi
            resolvers: [elementPlusResolver]
        }),

        // Mock API 插件
        viteMockServe({
            // 目录位置
            mockPath: "src/mock",
            // 是否在控制台显示请求日志
            logger: true,
            // 设置是否启用本地mock文件
            localEnabled: isMockEnabled,
            prodEnabled: isMockEnabled, // 设置打包是否启用mock功能
            // 这样可以控制关闭mock的时候不让mock打包到最终代码内
            injectCode: `
                import { setupProdMockServer } from '../src/mock/index';
                setupProdMockServer();
                `
        } as any)

    ]
}