/**
 * Type of the dispatch function.
 */
type Dispatch<TMsg> = (msg: TMsg) => void;

type FallbackHandler = (error?: Error) => void;
type Sub<TMsg> = (dispatch: Dispatch<TMsg>, fallback?: FallbackHandler) => void;

/**
 * Type of a command.
 */
type Cmd<TMsg> = Sub<TMsg> [];

/**
 * Contains functions to create commands.
 * @template TMsg Type of the Message discriminated union.
 */
interface Command<TMsg> {
    /**
     * Represents an empty command.
     */
    none: [],
    /**
     * Creates a command out of a specific message.
     * @param {TMsg} msg The specific message.
     */
    ofMsg: (msg: TMsg) => Cmd<TMsg>,
    /**
     * Aggregates multiple commands.
     * @param {Cmd<TMsg> []} commands Array of commands.
     */
    batch: (...commands: Cmd<TMsg> []) => Cmd<TMsg>,
    /**
     * Command to call the subscriber.
     * @param {Sub<TMsg>} sub The subscriber function.
     */
    ofSub: (sub: Sub<TMsg>) => Cmd<TMsg>,
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
        either: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs) => Cmd<TMsg>,
        /**
        * Creates a command out of a simple function and ignores the error case.
        * @param task The function to call.
        * @param ofSuccess Creates the message to dispatch after a successful call of the task.
        * @param args The parameters of the task.
        */
        perform: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMsg, ...args: TArgs) => Cmd<TMsg>,
        /**
        * Creates a command out of a simple function and ignores the success case.
        * @param task The function to call.
        * @param ofError Creates the message to dispatch when an error occurred.
        * @param args The parameters of the task.
        */
        attempt: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofError: (error: Error) => TMsg, ...args: TArgs) => Cmd<TMsg>,
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
        either: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs) => Cmd<TMsg>,
        /**
        * Creates a command out of an async function and ignores the error case.
        * @param task The async function to call.
        * @param ofSuccess Creates the message to dispatch when the promise is resolved.
        * @param args The parameters of the task.
        */
        perform: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMsg, ...args: TArgs) => Cmd<TMsg>,
        /**
        * Creates a command out of an async function and ignores the success case.
        * @param task The async function to call.
        * @param ofError Creates the message to dispatch when the promise is rejected.
        * @param args The parameters of the task.
        */
        attempt: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofError: (error: Error) => TMsg, ...args: TArgs) => Cmd<TMsg>,
    },
}

/**
 * Creates a typed instance of the Command class.
 * @template TMsg The type of the Msg discriminated union.
 */
export function createCmd<TMsg> (): Command<TMsg> {
    return {
        none: [],
        ofMsg (msg: TMsg): Cmd<TMsg> {
            return [dispatch => dispatch(msg)];
        },
        batch (...commands: Cmd<TMsg> []): Cmd<TMsg> {
            return commands.flat();
        },
        ofSub (sub: Sub<TMsg>): Cmd<TMsg> {
            return [sub];
        },
        ofFunc: {
            either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
                const bind = (dispatch: Dispatch<TMsg>): void => {
                    try {
                        const result = task(...args);

                        dispatch(ofSuccess(result));
                    } catch (ex: unknown) {
                        dispatch(ofError(ex as Error));
                    }
                };

                return [bind];
            },
            perform<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMsg, ...args: TArgs): Cmd<TMsg> {
                const bind = (dispatch: Dispatch<TMsg>, fallback?: FallbackHandler): void => {
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
            attempt<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
                const bind = (dispatch: Dispatch<TMsg>, fallback?: FallbackHandler): void => {
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
        ofPromise: {
            either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
                const bind = (dispatch: Dispatch<TMsg>): void => {
                    task(...args).then(result => dispatch(ofSuccess(result)))
                        .catch((ex: Error) => dispatch(ofError(ex)));
                };

                return [bind];
            },
            perform<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMsg, ...args: TArgs): Cmd<TMsg> {
                const defaultFallbackHandler = (): void => {
                    // blank
                };

                const bind = (dispatch: Dispatch<TMsg>, fallback: FallbackHandler = defaultFallbackHandler): void => {
                    task(...args).then(result => dispatch(ofSuccess(result)))
                        .catch(fallback);
                };

                return [bind];
            },
            attempt<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
                const bind = (dispatch: Dispatch<TMsg>, fallback?: FallbackHandler): void => {
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
}

export type {
    Dispatch,
    Cmd,
};