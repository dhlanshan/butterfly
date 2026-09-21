import Axios, {
    type AxiosInstance,
    type AxiosResponse,
    type Method
} from "axios";
import {ElMessage} from "element-plus";
import type {
    HttpLogPayload,
    HttpLogType,
    NewHttpRequestConfig,
    RequestLogConfig,
    RuntimeHttpRequestConfig
} from "./types.d";
export type {
    HttpLogPayload,
    HttpLogType,
    HttpMethod,
    NewHttpRequestConfig,
    RequestLogConfig,
    RuntimeHttpRequestConfig,
    Validator,
    ValidatorResult
} from "./types.d";



const DEFAULT_TIMEOUT_SECONDS = 30;
const DEFAULT_RETRY = 0;
const DEFAULT_RETRY_INTERVAL_SECONDS = 0;

// ResponseValidateError 响应校验器
export class ResponseValidateError<T = unknown> extends Error {
    data: T;
    displayMessage: string;

    constructor(data: T, displayMessage = "响应数据校验失败") {
        super(displayMessage);
        this.name = "ResponseValidateError";
        this.data = data;
        this.displayMessage = displayMessage;
    }
}

// printHttpLog 日志打印
export function printHttpLog(type: HttpLogType, payload: HttpLogPayload): void {
    switch (type) {
        case "request":
            console.log(
                `[Api] | ${payload.msgId} | ${String(payload.method).toUpperCase()} | ${payload.url} | Header:${formatLogValue(payload.headers)} | Body:${formatLogValue(payload.body)} | END`
            );
            break;
        case "response":
            console.log(
                `[Api] | ${payload.msgId} | 响应状态: ${payload.status ?? ""} | RespBody: ${formatLogValue(payload.responseBody)} | 重试次数:${payload.retryTimes ?? 0}/${payload.retryLimit ?? 0} | 耗时:${payload.elapsedTime} | END`
            );
            break;
    }
}

// 生成日志唯一ID
function genMsgId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `A${crypto.randomUUID().replaceAll("-", "")}`;
    }

    return `A${Date.now()}${Math.random().toString(16).slice(2)}`;
}

function formatLogValue(value: unknown): string {
    if (value === undefined || value === null || value === "") {
        return "";
    }

    if (value instanceof Error) {
        return value.message;
    }

    if (typeof value === "string") {
        return value;
    }

    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function formatElapsedTime(startTime?: number): string {
    if (!startTime) {
        return "0.00000s";
    }

    return `${((Date.now() - startTime) * 0.001).toFixed(5)}s`;
}

async function parseBlobResponseBody(blob: Blob): Promise<unknown> {
    const text = await blob.text();

    if (!text) {
        return "";
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function getErrorResponseBody(error: unknown): Promise<unknown> {
    if (isResponseValidateError(error)) {
        if (error.data && typeof error.data === "object") {
            return {
                ...(error.data as Record<string, unknown>),
                __validateMessage: error.displayMessage
            };
        }

        return {
            data: error.data,
            __validateMessage: error.displayMessage
        };
    }

    if (Axios.isAxiosError(error)) {
        const responseData = error.response?.data;

        if (responseData instanceof Blob) {
            return parseBlobResponseBody(responseData);
        }

        return responseData ?? error.message;
    }

    return error;
}

function getErrorMessage(responseBody: unknown): string {
    if (responseBody instanceof Error) {
        if (isResponseValidateError(responseBody)) {
            return responseBody.displayMessage;
        }

        return responseBody.message;
    }

    if (typeof responseBody === "string") {
        return responseBody || "服务器异常，请联系管理员";
    }

    if (responseBody && typeof responseBody === "object") {
        const body = responseBody as Record<string, unknown>;
        const validateMessage = body.__validateMessage;
        const message = body.message ?? body.msg;

        if (typeof validateMessage === "string" && validateMessage) {
            return validateMessage;
        }

        if (typeof message === "string" && message) {
            return message;
        }
    }

    return "服务器异常，请联系管理员";
}

function delay(seconds: number): Promise<void> {
    const duration = Math.max(seconds, 0) * 1000;

    if (duration === 0) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        window.setTimeout(resolve, duration);
    });
}

function isTimeoutError(error: unknown): boolean {
    return Axios.isAxiosError(error) && error.code === "ECONNABORTED";
}

function isResponseValidateError(error: unknown): error is ResponseValidateError {
    return error instanceof ResponseValidateError;
}

function shouldRetry<T>(error: unknown, config: NewHttpRequestConfig<T>, retriedTimes: number): boolean {
    const retry = config.Retry ?? DEFAULT_RETRY;

    if (retriedTimes >= retry) {
        return false;
    }

    return isTimeoutError(error) || isResponseValidateError(error);
}

function normalizeAxiosConfig<T>(config: RuntimeHttpRequestConfig<T>, retriedTimes: number): RequestLogConfig {
    const timeout = (config.Timeout ?? DEFAULT_TIMEOUT_SECONDS) * 1000;

    return {
        url: config.Url,
        method: config.Method.toLowerCase() as Method,
        headers: config.Header,
        params: config.Params,
        data: config.Data,
        timeout,
        EchoReq: config.EchoReq ?? false,
        EchoRes: config.EchoRes ?? false,
        MsgId: config.MsgId,
        RetryTimes: retriedTimes,
        RetryLimit: config.Retry ?? DEFAULT_RETRY
    };
}

async function validateResponseData<T>(data: T, config: NewHttpRequestConfig<T>): Promise<void> {
    if (!config.EnableValid) {
        return;
    }

    if (typeof config.Validator !== "function") {
        throw new Error("Validator is required when EnableValid is true");
    }

    const valid = await config.Validator(data);

    if (valid === true) {
        return;
    }

    if (valid instanceof Error) {
        throw new ResponseValidateError(data, valid.message || "响应数据校验失败");
    }

    if (typeof valid === "string") {
        throw new ResponseValidateError(data, valid || "响应数据校验失败");
    }

    if (valid && typeof valid === "object") {
        if (valid.valid) {
            return;
        }

        throw new ResponseValidateError(data, valid.message || "响应数据校验失败");
    }

    if (valid === false) {
        throw new ResponseValidateError(data);
    }

    throw new ResponseValidateError(data);
}

class NewHttpClient {
    private readonly axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = Axios.create({
            baseURL: import.meta.env.VITE_APP_BASE_URL
        });
        this.httpInterceptorsRequest();
        this.httpInterceptorsResponse();
    }

    private httpInterceptorsRequest(): void {
        this.axiosInstance.interceptors.request.use(
            config => {
                return config;
            },
            error => Promise.reject(error)
        );
    }

    private httpInterceptorsResponse(): void {
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            error => Promise.reject(error)
        );
    }

    public request<T = unknown>(config: NewHttpRequestConfig<T>): Promise<T> {
        const runtimeConfig: RuntimeHttpRequestConfig<T> = {
            ...config,
            MsgId: genMsgId(),
            StartTime: Date.now()
        };

        if (runtimeConfig.EchoReq) {
            printHttpLog("request", {
                msgId: runtimeConfig.MsgId,
                url: runtimeConfig.Url,
                method: runtimeConfig.Method,
                headers: runtimeConfig.Header,
                body: runtimeConfig.Data
            });
        }

        return this.requestWithRetry<T>(
            runtimeConfig,
            0
        );
    }

    private async requestWithRetry<T>(config: RuntimeHttpRequestConfig<T>, retriedTimes: number): Promise<T> {
        try {
            const response = await this.axiosInstance.request<unknown, AxiosResponse<T>>(
                normalizeAxiosConfig(config, retriedTimes)
            );
            const data = response.data;

            await validateResponseData(data, config);

            if (config.EchoRes) {
                printHttpLog("response", {
                    msgId: config.MsgId,
                    status: response.status,
                    responseBody: data,
                    retryTimes: retriedTimes,
                    retryLimit: config.Retry ?? DEFAULT_RETRY,
                    elapsedTime: formatElapsedTime(config.StartTime)
                });
            }

            return data;
        } catch (error) {
            if (!shouldRetry(error, config, retriedTimes)) {
                const responseBody = await getErrorResponseBody(error);

                if (config.EchoRes) {
                    printHttpLog("response", {
                        msgId: config.MsgId,
                        status: Axios.isAxiosError(error) ? error.response?.status : undefined,
                        responseBody,
                        retryTimes: retriedTimes,
                        retryLimit: config.Retry ?? DEFAULT_RETRY,
                        elapsedTime: formatElapsedTime(config.StartTime)
                    });
                }

                ElMessage.error(getErrorMessage(responseBody));

                throw error;
            }

            const nextRetryTimes = retriedTimes + 1;
            const retryInterval = config.RetryInterval ?? DEFAULT_RETRY_INTERVAL_SECONDS;

            await delay(retryInterval);

            return this.requestWithRetry<T>(config, nextRetryTimes);
        }
    }

    public get<T = unknown>(
        url: string,
        config?: Omit<NewHttpRequestConfig<T>, "Url" | "Method" | "Data">
    ): Promise<T> {
        return this.request<T>({
            ...config,
            Url: url,
            Method: "GET"
        });
    }

    public post<T = unknown>(
        url: string,
        data?: unknown,
        config?: Omit<NewHttpRequestConfig<T>, "Url" | "Method" | "Data">
    ): Promise<T> {
        return this.request<T>({
            ...config,
            Url: url,
            Method: "POST",
            Data: data
        });
    }

    public put<T = unknown>(
        url: string,
        data?: unknown,
        config?: Omit<NewHttpRequestConfig<T>, "Url" | "Method" | "Data">
    ): Promise<T> {
        return this.request<T>({
            ...config,
            Url: url,
            Method: "PUT",
            Data: data
        });
    }

    public delete<T = unknown>(
        url: string,
        config?: Omit<NewHttpRequestConfig<T>, "Url" | "Method" | "Data">
    ): Promise<T> {
        return this.request<T>({
            ...config,
            Url: url,
            Method: "DELETE"
        });
    }
}

export const http = new NewHttpClient();
