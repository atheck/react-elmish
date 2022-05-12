import { Services } from "./Init";
import { UpdateReturnType } from "./Types";

/**
 * Error message object.
 * Add this to your Message type.
 */
interface ErrorMessage {
    name: "error",
    error: Error,
}

/**
 * This object contains the function to create an error message.
 * Spread this into your Msg object.
 */
const errorMsg = {
    error: (error: Error): ErrorMessage => ({ name: "error", error }),
};

/**
 * Creates an object to handle error messages in an update map.
 * Spread this into your `UpdateMap`.
 * @returns An object containing an error handler function.
 */
function errorHandler<TModel, TMessage> (): { error: (msg: ErrorMessage) => UpdateReturnType<TModel, TMessage> } {
    return {
        error ({ error }) {
            return handleError(error);
        },
    };
}

/**
 * Handles an error.
 * Logs the error if a Logger was specified.
 * Calls the error handling middleware if specified.
 * @param {Error} error The error.
 */
function handleError<TModel, TMsg> (error: Error): UpdateReturnType<TModel, TMsg> {
    if (Services.errorMiddleware) {
        Services.errorMiddleware(error);
    }
    Services.logger?.error(error);

    return [{}];
}

export type { ErrorMessage };

export {
    errorMsg,
    errorHandler,
    handleError,
};