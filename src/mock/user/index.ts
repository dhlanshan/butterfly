import type {MockMethod} from "vite-plugin-mock";
import {resultSuccess, resultError} from "../_utils";
import {randomUUID} from "crypto";

const menuList = [
    {
        "name": "数据看板",
        "url" :"/dashboard",
        "icon":""
    },

]


export default [
    {
        "url": "/api/user/login",
        method: "post",
        timeout: 300,
        response: ({body}: any) => {
            let {username, password} = body;
            if (username === "admin" && password === "123456") {
                return resultSuccess({
                    accessToken: randomUUID().toString(),
                    accessTokenExpires: 12312312313,
                    refreshToken: randomUUID().toString(),
                    refreshTokenExpires: 2645665465,
                });
            }
            return resultError(null, "账号或者密码错误", 500);
        }
    },
    {
        "url": "/api/user/profile",
        method: "post",
        timeout: 300,
        response: () => {
            return resultSuccess({
                id: 123,
                username: "bee",
                nickname: "zjk",
                avatar: "https",
                gender: "男",
                menu: menuList
            })
        }
    },
] as MockMethod[]