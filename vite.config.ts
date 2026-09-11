import {defineConfig, loadEnv} from 'vite'
import {createVitePlugins} from "./build/vite-plugin/index";
import {include} from "./build/optimize";
import {fileURLToPath, URL} from "node:url"
import {wrapperEnv} from "./build/utils";

// https://vite.dev/config/
export default defineConfig(({mode}) => {
    // 根路径
    const root = process.cwd();
    // 获取跟路径对应的文件
    const env: ViteEnv = wrapperEnv(loadEnv(mode, root))
    return {
        // 插件列表：路径build/vite-plugin
        plugins: [
            ...createVitePlugins(env)
        ],

        // 解析
        resolve: {
            // 配置别名
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
                "@assets": fileURLToPath(new URL("./src/assets", import.meta.url))
            }
        },

        // css: {
        //     preprocessorOptions: {
        //         scss: {
        //             // additionalData的内容会在每个scss文件的开头自动注入
        //             additionalData: `@use "@/style/index.scss" as *; `
        //         }
        //     }
        // },

        optimizeDeps: {
            include
        },

        build: {
            outDir: "dist", // 指定打包路径，默认为项目根目录下的dist目录
            // minify: "esbuild", // esbuild打包更快但是不能去除console.log，terser打包慢但能去除console.log
            //minify: "terser", // Vite 2.6.x 以上需要配置 minify："terser"，terserOptions才能生效，terser可以去除 console.log
            minify: "terser", // 开发环境使用更快的esbuild
            terserOptions: {
                compress: {
                    keep_infinity: true, // 防止 Infinity 被压缩成 1/0，这可能会导致 Chrome 上的性能问题
                    drop_console: true, // 生产环境去除 console
                    drop_debugger: true // 生产环境去除 debugger
                },
                format: {
                    comments: false // 删除注释
                }
            },
            assetsInlineLimit: 50 * 1024, // 生产环境降低内联阈值
            chunkSizeWarningLimit: 50000, // 规定触发警告的 chunk 大小, 这里设置阈值为50kb, 消除打包大小超过500kb警告
            // 静态资源打包到dist下的不同目录,将文件类型css、js、jpg等文件分开存储
            rolldownOptions: {
                output: {
                    chunkFileNames: "static/js/[name]-[hash].js",
                    entryFileNames: "static/js/[name]-[hash].js",
                    assetFileNames: "static/[ext]/[name]-[hash].[ext]"
                }
            }
        }
    }
})
