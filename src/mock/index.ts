import {createProdMockServer} from 'vite-plugin-mock/client'
import userModule from "./user/index";
import menuModule from "./system/menu"

export async function setupProdMockServer() {
    await createProdMockServer([
        ...userModule,
        ...menuModule
    ])
}