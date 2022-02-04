import { errorMiddleware, LoggerService } from "./Init";
import { UpdateReturnType } from "./ElmComponent";

/**
 * Handles an error.
 * Logs the error if a Logger was specified.
 * Calls the error handling middleware if specified.
 * @param {Error} error The error.
 */
export const handleError = <TModel, TMsg>(error: Error): UpdateReturnType<TModel, TMsg> => {
    if (errorMiddleware) {
        errorMiddleware(error);
    }
    LoggerService?.error(error);

    return [{}];
};

export type Nullable<T> = T | null;

/**
 * Creates a MsgSource type.
 */
export interface MsgSource<T extends string> {
    source: T,
}