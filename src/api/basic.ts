// 基础响应接口
export interface Response<T = any> {
    code: number;
    msg: string;
    data: T;
}