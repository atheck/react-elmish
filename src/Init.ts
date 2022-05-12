interface Logger {
    debug: (...args: unknown []) => void,
    info: (...args: unknown []) => void,
    error: (...args: unknown []) => void,
}

interface Message {
    name: string | symbol,
}

type ErrorMiddlewareFunc = (error: Error) => void;
type DispatchMiddlewareFunc = (msg: Message) => void;

interface ElmOptions {
    logger?: Logger,
    errorMiddleware?: ErrorMiddlewareFunc,
    dispatchMiddleware?: DispatchMiddlewareFunc,
}

const Services: ElmOptions = {
    logger: undefined,
    errorMiddleware: undefined,
    dispatchMiddleware: undefined,
};

function init (options: ElmOptions): void {
    Services.logger = options.logger;
    Services.errorMiddleware = options.errorMiddleware;
    Services.dispatchMiddleware = options.dispatchMiddleware;
}

export type {
    Logger,
    Message,
    ErrorMiddlewareFunc,
    DispatchMiddlewareFunc,
    ElmOptions,
};

export {
    Services,
    init,
};