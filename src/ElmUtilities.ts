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

export interface MessageBase {
    name: string | symbol,
}

/**
 * Creates a MsgSource type.
 */
export interface MsgSource<T extends string> {
    source: T,
}

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmishMap hook.
 */
export type UpdateMap<TProps, TModel, TMsg extends MessageBase> = {
    [M in TMsg as M["name"]]: (msg: M, model: TModel, props: TProps) => UpdateReturnType<TModel, TMsg>;
};

export interface ErrorMessage {
    name: "error",
    error: Error,
}

export const errorMsg = {
    error: (error: Error): ErrorMessage => ({ name: "error", error }),
};