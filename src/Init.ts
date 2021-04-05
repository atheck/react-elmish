export interface ILogger {
    debug: (...args: unknown []) => void,
    info: (...args: unknown []) => void,
    error: (...args: unknown []) => void,
}

export interface IMessage {
    name: string | symbol,
}

export type ErrorMiddlewareFunc = (error: Error) => void;
export type DispatchMiddlewareFunc = (msg: IMessage) => void;

export let LoggerService: ILogger | null = null;
export let ErrorMiddleware: ErrorMiddlewareFunc | null = null;
export let DispatchMiddleware: DispatchMiddlewareFunc | null = null;

export type ElmOptions = {
    logger?: ILogger,
    errorMiddleware?: ErrorMiddlewareFunc,
    dispatchMiddleware?: DispatchMiddlewareFunc,
};

const init = (options: ElmOptions) => {
    LoggerService = options.logger ?? null;
    ErrorMiddleware = options.errorMiddleware ?? null;
    DispatchMiddleware = options.dispatchMiddleware ?? null;
};

export { init };
