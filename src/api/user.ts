import {http} from "@/utils/http"
import type {Response} from "./basic"


export type LoginReq = {
    username: string,
    password: string,
}
export type LoginResp = Response<{
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
    refreshTokenExpires: number;
}>

export type ProfileItem = {
    id: number,         // 用户ID
    username: string,   // 用户名
    nickname: string,   // 昵称
    avatar: string,     // 头像
    gender: string,     // 性别
}

export type getProfileResp = Response<ProfileItem>;


// 登录
export const loginApi = (data: LoginReq) => {
    return http.request<LoginResp>("post", `/api/user/login`, {data})
};

// 登出
export const logoutApi = () => {
    return http.request<Response>("post", `/api/user/logout`)
};

// 刷新token
export const refreshTokenApi = (refreshToken: string) => {
    return http.request<LoginResp>("post", `/api/user/refreshToken`, {data: {refreshToken}});
};

// 获取登录用户信息
export const getProfileAPI = () => {
    return http.request<getProfileResp>("post", `/api/user/profile`);
};