/**
 * 本地存储 key 前缀。
 *
 * 用途：
 * - 项目作为模板复用时，不同项目只需要修改 .env 中的 VITE_STORAGE_PREFIX。
 * - 避免多个项目部署在同一域名或同一开发地址下时，共用 localStorage 数据。
 */
const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX?.trim() || "butterfly";

const buildKey = (key: string, separator: ":" | "-") => `${STORAGE_PREFIX}${separator}${key}`;

/**
 * 生成带项目命名空间的本地存储 key。
 *
 * 示例：
 * - storageKey("bee-settings") => "butterfly:bee-settings"
 * - storageKey("theme-config") => "butterfly:theme-config"
 */
export const storageKey = (key: string) => buildKey(key, ":");

/**
 * 生成带项目命名空间的 Cookie key。
 *
 * Cookie 名称不使用冒号，避免不同浏览器/中间件对 Cookie name 解析不一致。
 */
export const cookieKey = (key: string) => buildKey(key, "-");
