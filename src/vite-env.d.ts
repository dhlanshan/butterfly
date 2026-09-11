/// <reference types="vite/client" />
declare module "*.vue" {
    import type {DefineComponent} from "vue"
    const component: DefineComponent<{}, {}, any>
    export default component
}

interface ImportMetaEnv {
    readonly VITE_GLOB_APP_TITLE: string;
    readonly VITE_IMG_BASE_URL: string;
    readonly VITE_APP_OPEN_MOCK: string;
    readonly VITE_USER_NODE_ENV: "development" | "production" | "test";
    readonly VITE_PUBLIC_PATH: string;
    readonly VITE_APP_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}