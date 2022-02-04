export interface Logger {
    debug: (...args: unknown []) => void,
    info: (...args: unknown []) => void,
    error: (...args: unknown []) => void,
}

export interface Message {
    name: string | symbol,
}

export type ErrorMiddlewareFunc = (error: Error) => void;
export type DispatchMiddlewareFunc = (msg: Message) => void;

export let LoggerService: Logger | null = null;
export let errorMiddleware: ErrorMiddlewareFunc | null = null;
export let dispatchMiddleware: DispatchMiddlewareFunc | null = null;

export interface ElmOptions {
    logger?: Logger,
    errorMiddleware?: ErrorMiddlewareFunc,
    dispatchMiddleware?: DispatchMiddlewareFunc,
}

const init = (options: ElmOptions): void => {
    LoggerService = options.logger ?? null;
    errorMiddleware = options.errorMiddleware ?? null;
    dispatchMiddleware = options.dispatchMiddleware ?? null;
};

export { init };