import {http} from "@/utils/http"
import type {Response} from "@/api/basic.ts";

export interface MenuItem {
    id: number;
    parentId: number;
    name: string;
    path: string;
    component: string;
    redirect: string;
    children: MenuItem[];
    // 附加信息
    affix: boolean;
    title: string;
    isFull: boolean;
    hide: boolean;
    disable: boolean;
    link: string;
    svgIcon: string;
    iframe: boolean;
    icon: string;
    sort: number;
    type: number;
    keepAlive: boolean;
    permission: string;
    // apis: SysApiItem[] | null;
    createdBy: number;
    createdTime: string;
    updatedTime: string;
    deletedTime: string;
}

export type getRoutersResp = Response<MenuItem[]>;

// 获取当前用户有权限的菜单数据不含按钮
export const getRoutersAPI = () => {
    return http.request<getRoutersResp>("get", "/sysMenu/routers");
};