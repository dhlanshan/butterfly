

export const resultSuccess = (data: unknown) => {
    return {
        code: 0,
        msg: 'success',
        data: data,
    }
}

export const resultError = (data: unknown, message: string, code = 500) => {
    return {
        code: code,
        msg: message,
        data: data,
    };
};