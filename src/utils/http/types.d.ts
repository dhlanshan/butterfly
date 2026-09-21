import type {AxiosRequestConfig, Method} from "axios";

/** HTTP 请求方法，只允许当前请求工具明确支持的方法。 */
export type HttpMethod = Extract<
    Uppercase<Method>,
    "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
>;

/** 响应数据校验器的返回值，支持布尔值、错误消息、Error 或结构化校验结果。 */
export type ValidatorResult =
    | boolean
    | string
    | Error
    | {
    /** 是否校验通过。 */
    valid: boolean;
    /** 校验失败时展示给用户的错误消息。 */
    message?: string;
};

/** 响应数据校验函数，可同步或异步返回校验结果。 */
export type Validator<T = unknown> = (data: T) => ValidatorResult | Promise<ValidatorResult>;

/** 新 HTTP 请求工具的配置项。 */
export interface NewHttpRequestConfig<T = unknown> {
    /** 请求的 URL。 */
    Url: string;
    /** 请求方法，如 GET、POST 等。 */
    Method: HttpMethod;
    /** 请求头。 */
    Header?: Record<string, string>;
    /** URL 查询参数。 */
    Params?: Record<string, string | number | boolean | null | undefined>;
    /** 请求体数据。 */
    Data?: unknown;
    /** 失败后的最大重试次数，默认 0。 */
    Retry?: number;
    /** 重试间隔，单位秒，默认 0。 */
    RetryInterval?: number;
    /** 是否启用响应数据校验，默认 false。 */
    EnableValid?: boolean;
    /** 响应数据校验函数，返回 true 或 { valid: true } 表示校验通过。 */
    Validator?: Validator<T>;
    /** 请求超时时间，单位秒，默认 30。 */
    Timeout?: number;
    /** 是否打印请求日志，默认 false。 */
    EchoReq?: boolean;
    /** 是否打印响应日志，默认 false。 */
    EchoRes?: boolean;
}

/** Axios 请求配置扩展，用于携带请求日志和重试信息。 */
export type RequestLogConfig = AxiosRequestConfig & {
    /** 是否打印请求日志。 */
    EchoReq?: boolean;
    /** 是否打印响应日志。 */
    EchoRes?: boolean;
    /** 单次请求的日志 ID。 */
    MsgId?: string;
    /** 当前已经重试的次数。 */
    RetryTimes?: number;
    /** 最大重试次数。 */
    RetryLimit?: number;
};

/** 运行时请求配置，包含请求开始时间和日志 ID。 */
export type RuntimeHttpRequestConfig<T = unknown> = NewHttpRequestConfig<T> & {
    /** 单次请求的日志 ID。 */
    MsgId: string;
    /** 请求开始时间戳，用于计算耗时。 */
    StartTime: number;
};

/** HTTP 日志类型，区分请求日志和响应日志。 */
export type HttpLogType = "request" | "response";

/** HTTP 日志打印所需的数据载荷。 */
export type HttpLogPayload = {
    /** 单次请求的日志 ID。 */
    msgId: string;
    /** 请求方法。 */
    method?: Method | string;
    /** 请求 URL。 */
    url?: string;
    /** 请求头。 */
    headers?: unknown;
    /** 请求体。 */
    body?: unknown;
    /** 响应状态码。 */
    status?: number;
    /** 响应体或错误响应体。 */
    responseBody?: unknown;
    /** 请求耗时。 */
    elapsedTime?: string;
    /** 当前已经重试的次数。 */
    retryTimes?: number;
    /** 最大重试次数。 */
    retryLimit?: number;
    /** 日志附加原因。 */
    reason?: unknown;
};
