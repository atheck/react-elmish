import type { Message } from "./Types";

interface Logger {
	debug: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
}

type ErrorMiddlewareFunc = (error: Error) => void;
type DispatchMiddlewareFunc = (msg: Message) => void;

interface ElmOptions {
	/**
	 * The logger to use for logging called messages and updated models.
	 * @type {Logger}
	 */
	logger?: Logger;

	/**
	 * Middleware to call when error messages are handled by the `handleError` function.
	 * @type {ErrorMiddlewareFunc}
	 */
	errorMiddleware?: ErrorMiddlewareFunc;

	/**
	 * Middleware to call for every processed message.
	 * @type {DispatchMiddlewareFunc}
	 */
	dispatchMiddleware?: DispatchMiddlewareFunc;

	enableDevTools?: boolean;
}

const Services: ElmOptions = {
	logger: undefined,
	errorMiddleware: undefined,
	dispatchMiddleware: undefined,
	enableDevTools: false,
};

/**
 * This initializes the Elmish module.
 * You only need to call this function if you want to set some of the options.
 * @param {ElmOptions} options
 */
function init(options: ElmOptions): void {
	Services.logger = options.logger;
	Services.errorMiddleware = options.errorMiddleware;
	Services.dispatchMiddleware = options.dispatchMiddleware;
	Services.enableDevTools = options.enableDevTools;
}

export type { DispatchMiddlewareFunc, ElmOptions, ErrorMiddlewareFunc, Logger };

export { init, Services };
