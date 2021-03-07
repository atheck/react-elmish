import { UpdateReturnType } from "./ElmComponent";
import { LoggerService, ErrorMiddleware } from "./Init";

/**
 * Handles an error.
 * Logs the error if a Logger was specified.
 * Calls the error handling middleware if specified.
 * @param {Error} error The error.
 */
export const handleError = <TModel, TMsg>(error: Error): UpdateReturnType<TModel, TMsg> => {
    if (ErrorMiddleware) {
        ErrorMiddleware(error);
    }
    LoggerService?.error(error);

    return [{}];
};

declare global {
    export type Nullable<T> = T | null;
}

/**
 * Creates a MsgSource type.
 */
export type MsgSource<T extends string> = { source: T };