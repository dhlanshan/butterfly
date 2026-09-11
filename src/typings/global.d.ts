/* viteEnv (给 Vite 配置/构建脚本使用) */
type ViteEnv = Omit<ImportMetaEnv, "VITE_APP_OPEN_MOCK"> & {
    VITE_APP_OPEN_MOCK: boolean | string;
};

declare namespace Menu {
    interface MenuOptions {
        id: string;
        parentId: string;
        fullPath?: stirng;
        path: string;
        name: string;
        redirect?: string;
        component?: string | (() => Promise<unknown>);
        meta: MetaType;
        children?: MenuOptions[] | null | any;
    }

    interface MetaType {
        title: string;
        hide: boolean;
        disable: boolean;
        keepAlive: boolean;
        affix: boolean;
        link?: string;
        iframe?: boolean;
        roles: Array<string>;
        icon?: string;
        svgIcon?: string;
        sort?: number;
        type?: number;
    }
}