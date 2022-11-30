import { Cmd, Dispatch, FallbackHandler, Message, Sub } from "./Types";

const cmd = {
    /**
     * Creates a command out of a specific message.
     * @param {TMessage} msg The specific message.
     */
    ofMsg<TMessage extends Message> (msg: TMessage): Cmd<TMessage> {
        return [dispatch => dispatch(msg)];
    },
    /**
     * Aggregates multiple commands.
     * @param {Cmd<TMessage> []} commands Array of commands.
     */
    batch<TMessage extends Message> (...commands: (Cmd<TMessage> | undefined | null) []): Cmd<TMessage> {
        return (commands.filter(Boolean) as Cmd<TMessage> []).flat();
    },
    /**
     * Command to call the subscriber.
     * @param {Sub<TMessage>} sub The subscriber function.
     */
    ofSub<TMessage extends Message> (sub: Sub<TMessage>): Cmd<TMessage> {
        return [sub];
    },
    /**
     * Provides functionalities to create commands from simple functions.
     */
    ofFunc: {
        /**
        * Creates a command out of a simple function and maps the result.
        * @param task The function to call.
        * @param ofSuccess Creates the message to dispatch after a successful call of the task.
        * @param ofError Creates the message to dispatch when an error occurred.
        * @param args The parameters of the task.
        */
        either<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMessage, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>): void => {
                try {
                    const result = task(...args);

                    dispatch(ofSuccess(result));
                } catch (ex: unknown) {
                    dispatch(ofError(ex as Error));
                }
            };

            return [bind];
        },
        /**
        * Creates a command out of a simple function and ignores the error case.
        * @param task The function to call.
        * @param ofSuccess Creates the message to dispatch after a successful call of the task.
        * @param args The parameters of the task.
        */
        perform<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>, fallback?: FallbackHandler): void => {
                try {
                    const result = task(...args);

                    dispatch(ofSuccess(result));
                } catch (ex: unknown) {
                    if (fallback) {
                        fallback(ex as Error);
                    }
                }
            };

            return [bind];
        },
        /**
        * Creates a command out of a simple function and ignores the success case.
        * @param task The function to call.
        * @param ofError Creates the message to dispatch when an error occurred.
        * @param args The parameters of the task.
        */
        attempt<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>, fallback?: FallbackHandler): void => {
                try {
                    task(...args);

                    if (fallback) {
                        fallback();
                    }
                } catch (ex: unknown) {
                    dispatch(ofError(ex as Error));
                }
            };

            return [bind];
        },
    },
    /**
     * Provides functionalities to create commands from async functions.
     */
    ofPromise: {
        /**
        * Creates a command out of an async function and maps the result.
        * @param task The async function to call.
        * @param ofSuccess Creates the message to dispatch when the promise is resolved.
        * @param ofError Creates the message to dispatch when the promise is rejected.
        * @param args The parameters of the task.
        */
        either<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMessage, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>): void => {
                task(...args).then(result => dispatch(ofSuccess(result)))
                    .catch((ex: Error) => dispatch(ofError(ex)));
            };

            return [bind];
        },
        /**
        * Creates a command out of an async function and ignores the error case.
        * @param task The async function to call.
        * @param ofSuccess Creates the message to dispatch when the promise is resolved.
        * @param args The parameters of the task.
        */
        perform<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const defaultFallbackHandler = (): void => {
                // blank
            };

            const bind = (dispatch: Dispatch<TMessage>, fallback: FallbackHandler = defaultFallbackHandler): void => {
                task(...args).then(result => dispatch(ofSuccess(result)))
                    .catch(fallback);
            };

            return [bind];
        },
        /**
        * Creates a command out of an async function and ignores the success case.
        * @param task The async function to call.
        * @param ofError Creates the message to dispatch when the promise is rejected.
        * @param args The parameters of the task.
        */
        attempt<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>, fallback?: FallbackHandler): void => {
                task(...args).then(() => {
                    if (fallback) {
                        fallback();
                    }
                })
                    .catch((ex: Error) => dispatch(ofError(ex)));
            };

            return [bind];
        },
    },
};

export {
    cmd,
};