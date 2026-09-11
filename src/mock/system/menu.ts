import {systemRouter} from "../_data/system_menu.ts";
import {resultSuccess} from "../_utils.ts";
import type {MockMethod} from "vite-plugin-mock";

export default [
    {
        url: "/sysMenu/routers",
        method: "get",
        timeout: 300,
        response: () => {
            return resultSuccess(systemRouter);
        }
    }
] as MockMethod[]