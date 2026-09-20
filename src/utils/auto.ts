import Cookies from "js-cookie";
import {cookieKey, storageKey} from "@/utils/storage/keys.ts";

// 类型定义
export interface AccessTokenData {
    // token
    accessToken: string;
    // token过期时间(时间戳)
    accessTokenExpires: number;
}

export interface RefreshTokenData {
    // 用于调用刷新accessToken的接口时所需的token
    refreshToken: string;
    // refreshToken的过期时间(时间戳)
    refreshTokenExpires: number;
}

export const AccessTokenKey = cookieKey("bee-access-token");
export const RefreshTokenKey = cookieKey("bee-refresh-token");
export const UserInfoKey = storageKey("bee-user-info");

export function hasRefreshToken(): boolean {
    return !!Cookies.get(RefreshTokenKey);
}

export function getAccessToken(): AccessTokenData | null {
    const cookieToken = Cookies.get(AccessTokenKey);
    if (cookieToken) {
        return JSON.parse(cookieToken);
    }
    return null;
}

export function getRefreshToken(): RefreshTokenData | null {
    const cookieToken = Cookies.get(RefreshTokenKey);
    if (cookieToken) {
        return JSON.parse(cookieToken);
    }
    return null;
}

export function setRefreshToken(refreshToken: string, refreshTokenExpires: number) {
    if (!refreshToken || !refreshTokenExpires) {
        return;
    }
    const cookieString = JSON.stringify({
        refreshToken: refreshToken,
        refreshTokenExpires
    });

    Cookies.set(RefreshTokenKey, cookieString, {
        expires: (refreshTokenExpires * 1000 - Date.now()) / 86400000
    });
}

export function setAccessToken(accessToken: string, accessTokenExpires: number) {
    if (!accessToken || !accessTokenExpires) {
        return;
    }
    const cookieString = JSON.stringify({
        accessToken: accessToken,
        accessTokenExpires
    });
    Cookies.set(AccessTokenKey, cookieString, {
        expires: (accessTokenExpires * 1000 - Date.now()) / 86400000
    });
}

/** 删除`token`信息 */
export function removeAccessToken() {
    Cookies.remove(AccessTokenKey);
}

export function removeRefreshToken() {
    Cookies.remove(RefreshTokenKey);
}

export const formatToken = (token: string): string => {
    return "Bearer " + token;
};
