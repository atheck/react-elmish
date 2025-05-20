import type { Cmd, Dispatch, FallbackHandler, Message, Sub } from "./Types";

const cmd = {
	/**
	 * Creates a command out of a specific message.
	 * @param {TMessage} msg The specific message.
	 */
	ofMsg<TMessage extends Message>(msg: TMessage): Cmd<TMessage> {
		return [(dispatch) => dispatch(msg)];
	},

	/**
	 * Aggregates multiple commands.
	 * @param {Cmd<TMessage> []} commands Array of commands.
	 */
	batch<TMessage extends Message>(...commands: (Cmd<TMessage> | undefined | null)[]): Cmd<TMessage> {
		return commands.filter((current) => current != null).flat();
	},

	/**
	 * Command to call the subscriber.
	 * @param {Sub<TMessage>} sub The subscriber function.
	 */
	ofSub<TMessage extends Message>(sub: Sub<TMessage>): Cmd<TMessage> {
		return [sub];
	},

	/**
	 * Creates a command out of a function and maps the result. This can also be an async function.
	 * @param task The function to call.
	 * @param ofSuccess Creates the message to dispatch when the function runs successfully or, for an async function, the promise is resolved.
	 * @param ofError Creates the message to dispatch when the function throws an error or, for an async function, the promise is rejected.
	 * @param args The parameters of the task.
	 */
	ofEither<TSuccessMessage extends Message, TErrorMessage extends Message, TArgs extends unknown[], TReturn>(
		task: (...args: TArgs) => TReturn,
		ofSuccess: (result: Awaited<TReturn>) => TSuccessMessage,
		ofError: (error: Error) => TErrorMessage,
		...args: TArgs
	): Cmd<TSuccessMessage | TErrorMessage> {
		const bind = (dispatch: Dispatch<TSuccessMessage | TErrorMessage>): void => {
			try {
				const taskResult = task(...args);

				Promise.resolve(taskResult)
					.then((result) => dispatch(ofSuccess(result)))
					// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- We only support Error types here.
					.catch((ex: unknown) => dispatch(ofError(ex as Error)));
			} catch (ex: unknown) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- We only support Error types here.
				dispatch(ofError(ex as Error));
			}
		};

		return [bind];
	},

	/**
	 * Creates a command out of a function and ignores the error case. This can also be an async function.
	 * @param task The async function to call.
	 * @param ofSuccess Creates the message to dispatch when the function runs successfully or, for an async function, the promise is resolved.
	 * @param args The parameters of the task.
	 */
	ofSuccess<TSuccessMessage extends Message, TArgs extends unknown[], TReturn>(
		task: (...args: TArgs) => TReturn,
		ofSuccess: (result: Awaited<TReturn>) => TSuccessMessage,
		...args: TArgs
	): Cmd<TSuccessMessage> {
		const bind = (dispatch: Dispatch<TSuccessMessage>, fallback: FallbackHandler = defaultFallbackHandler): void => {
			try {
				const taskResult = task(...args);

				Promise.resolve(taskResult)
					.then((result) => dispatch(ofSuccess(result)))
					.catch(() => fallback());
			} catch {
				fallback();
			}
		};

		return [bind];
	},

	/**
	 * Creates a command out of a function and ignores the success case. This can also be an async function.
	 * @param task The function to call.
	 * @param ofError Creates the message to dispatch when the function runs successfully or, for an async function, the promise is rejected.
	 * @param args The parameters of the task.
	 */
	ofError<TErrorMessage extends Message, TArgs extends unknown[]>(
		task: (...args: TArgs) => unknown,
		ofError: (error: Error) => TErrorMessage,
		...args: TArgs
	): Cmd<TErrorMessage> {
		const bind = (dispatch: Dispatch<TErrorMessage>, fallback?: FallbackHandler): void => {
			try {
				const taskResult = task(...args);

				Promise.resolve(taskResult)
					.then(() => fallback?.())
					// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- We only support Error types here.
					.catch((ex: unknown) => dispatch(ofError(ex as Error)));
			} catch (ex: unknown) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- We only support Error types here.
				dispatch(ofError(ex as Error));
			}
		};

		return [bind];
	},

	/**
	 * Creates a command out of a function and ignores both, the success case and the error case. This can also be an async function.
	 * @param task The function to call.
	 * @param args The parameters of the task.
	 */
	ofNone<TErrorMessage extends Message, TArgs extends unknown[]>(
		task: (...args: TArgs) => unknown,
		...args: TArgs
	): Cmd<TErrorMessage> {
		const bind = (_dispatch: Dispatch<TErrorMessage>, fallback?: FallbackHandler): void => {
			try {
				const taskResult = task(...args);

				Promise.resolve(taskResult)
					.then(() => fallback?.())
					.catch(() => fallback?.());
			} catch {
				fallback?.();
			}
		};

		return [bind];
	},
};

function defaultFallbackHandler(): void {
	// blank
}

export { cmd };
