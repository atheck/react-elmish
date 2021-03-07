export interface ILogger {
    debug: (...args: unknown []) => void,
    info: (...args: unknown []) => void,
    error: (...args: unknown []) => void,
}

export type ErrorMiddlewareFunc = (error: Error) => void;

export let LoggerService: ILogger | null = null;
export let ErrorMiddleware: ErrorMiddlewareFunc | null = null;

export type ElmOptions = {
    logger?: ILogger,
    errorMiddleware?: ErrorMiddlewareFunc,
};

const init = (options: ElmOptions) => {
    LoggerService = options.logger ?? null;
    ErrorMiddleware = options.errorMiddleware ?? null;
};

export { init };
