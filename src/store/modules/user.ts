import {defineStore} from "pinia";
import pinia from "@/store";
import {getProfileAPI, loginApi} from "@/api/user";
import type {LoginReq} from "@/api/user"
import {removeAccessToken, removeRefreshToken, setAccessToken, setRefreshToken, UserInfoKey} from "@/utils/auto.ts";
import {getStorage, removeStorage, setStorage} from "@/utils/storage";
import type {userInfoType} from "@/store/types.ts";


export const useUserStore = defineStore("user", () => {
    // 先从本地存储中读取
    const userInfo = getStorage<userInfoType>("local", UserInfoKey)
    const account = ref<userInfoType>({
        id: userInfo?.id ?? 0,
        username: userInfo?.username ?? "",
        nickname: userInfo?.nickname ?? "",
        avatar: userInfo?.avatar ?? "",
        gender: userInfo?.gender ?? "",
    })

    // 登录
    const login = async (data: LoginReq) => {
        const resp = await loginApi(data)
        if (resp.code !== 0) {
            throw new Error(resp.msg || "登录失败");
        }

        // 清除token以及用户信息
        removeAccessToken();
        removeRefreshToken();
        removeStorage("local", UserInfoKey)

        // 设置新token
        setAccessToken(resp.data.accessToken, resp.data.accessTokenExpires)
        setRefreshToken(resp.data.refreshToken, resp.data.refreshTokenExpires)

    }
    // 登出
    const logout = async () => {
        account.value.id = 0;
        account.value.avatar = "";
        account.value.username = "";
        account.value.nickname = "";
        // 清除 accessToken 、 refreshToken 及登录用户信息
        removeAccessToken();
        removeRefreshToken();
        removeStorage("local", UserInfoKey);
    }
    // 获取用户信息
    const getUserInfo = async () => {
        const resp = await getProfileAPI()
        if (resp.code === 0 && resp.data?.id) {
            account.value.id = resp.data.id
            account.value.username = resp.data.username
            account.value.nickname = resp.data.nickname
            account.value.avatar = resp.data.avatar
            account.value.gender = resp.data.gender

            // 更新本地存储
            setStorage("local", UserInfoKey, resp.data)
        }
    }

    return {login, logout, getUserInfo, account}
})

export function useUserStoreHook() {
    return useUserStore(pinia);
}
