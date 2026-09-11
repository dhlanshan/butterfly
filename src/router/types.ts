// 转换后的路由结构接口
export interface ConvertedRouteItem {
    id: number;
    parentId: number;
    path: string;
    name: string;
    component: string;
    redirect: string;
    meta: {
        title: string;
        hide: boolean;
        disable: boolean;
        keepAlive: boolean;
        affix: boolean;
        link: string;
        iframe: boolean;
        isFull: boolean;
        roles: string[];
        permission: string;
        svgIcon: string;
        icon: string;
        sort: number;
        type: number;
    };
    children: ConvertedRouteItem[] | null;
}