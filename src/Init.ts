/**
 * @deprecated Use Logger instead.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ILogger {
    debug: (...args: unknown []) => void,
    info: (...args: unknown []) => void,
    error: (...args: unknown []) => void,
}
// eslint-disable-next-line @delagen/deprecation/deprecation
export interface Logger extends ILogger {}

/**
 * @deprecated Use Message instead.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IMessage {
    name: string | symbol,
}

// eslint-disable-next-line @delagen/deprecation/deprecation
export interface Message extends IMessage {}

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