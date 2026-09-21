import {http} from "@/utils/http";
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
    return http.request<LoginResp>({
        Url: "/api/user/login",
        Method: "POST",
        Retry: 2,
        RetryInterval: 1,
        Timeout: 10,
        EchoReq: true,
        EchoRes: true,
        Data: data,
    })
};

// 登出
export const logoutApi = () => {
    return http.request<Response>({
        Url: "/api/user/logout",
        Method: "POST",
        Retry: 2,
        RetryInterval: 1,
        Timeout: 10,
        EchoReq: true,
        EchoRes: true,
    })
};

// 刷新token
export const refreshTokenApi = (refreshToken: string) => {
    return http.request<LoginResp>({
        Url: "/api/user/refreshToken",
        Method: "POST",
        Retry: 2,
        RetryInterval: 1,
        Timeout: 10,
        EchoReq: true,
        EchoRes: true,
        Data: {data: {refreshToken}},
    })
};

// 获取登录用户信息
export const getProfileAPI = () => {
    return http.request<getProfileResp>({
        Url: "/api/user/profile",
        Method: "POST",
        Retry: 2,
        RetryInterval: 1,
        Timeout: 10,
        EchoReq: true,
        EchoRes: true,
        EnableValid: true,
        Validator: data => ({
            valid: data.code === 0,
            message: "用户信息响应状态码错误"
        })
    });
};
