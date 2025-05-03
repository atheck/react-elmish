import type { ErrorMessage } from "../ErrorHandling";
import { Services } from "../Init";
import type { UpdateReturnType } from "./Types";

/**
 * Creates an object to handle error messages in an update map.
 * Spread the object returned by this function into your `UpdateMap`.
 * @returns An object containing an error handler function.
 * @example
 * ```ts
 * const update: UpdateMap<Props, Model, Message> = {
 *     // ...
 *     ...errorHandler(),
 * };
 * ```
 */
function errorHandler<TMessage>(): {
	error: (msg: ErrorMessage) => UpdateReturnType<TMessage>;
} {
	return {
		error({ error }) {
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
function handleError<TMessage>(error: Error): UpdateReturnType<TMessage> {
	if (Services.errorMiddleware) {
		Services.errorMiddleware(error);
	}
	Services.logger?.error(error);

	return [];
}

export { errorHandler, handleError };
