/**
 * 从storage中获取指定key
 * @param type storage类型
 * @param key  指定key
 */
export function getStorage<T>(type: "local" | "session", key: string): T | null {
    const storage = type === "local" ? localStorage : sessionStorage;
    try {
        const raw = storage.getItem(key);
        if (raw === null) return null;

        try {
            return JSON.parse(raw) as T;
        } catch {
            return raw as T;
        }
    } catch {
        return null
    }
}

/**
 * 向storage中保存数据
 * @param type storage类型
 * @param key 指定key
 * @param value 保存的数据
 */
export function setStorage(type: "local" | "session", key: string, value: unknown): boolean {
    const storage = type === "local" ? localStorage : sessionStorage;
    try {
        storage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

/**
 * 从storage中删除指定key
 * @param type storage类型
 * @param key 指定key
 */
export function removeStorage(type: "local" | "session", key: string): void {
    const storage = type === "local" ? localStorage : sessionStorage;
    storage.removeItem(key);
}