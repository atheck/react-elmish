/**
 * Type of the dispatch function.
 */
export type Dispatch<TMsg> = (msg: TMsg) => void;

type FallbackHandler = (error?: Error) => void;
type Sub<TMsg> = (dispatch: Dispatch<TMsg>, fallback?: FallbackHandler) => void;

/**
 * Type of a command.
 */
export type Cmd<TMsg> = Sub<TMsg> [];

/**
 * Class to create commands.
 * @class Command
 * @template TMsg Type of the Msg discriminated union.
 */
class Command<TMsg> {
    /**
     * Represents an empty command.
     */
    public none = [];

    /**
     * Creates a command out of a specific message.
     * @param {TMsg} msg The specific message.
     */
    // eslint-disable-next-line class-methods-use-this
    public ofMsg (msg: TMsg): Cmd<TMsg> {
        return [dispatch => dispatch(msg)];
    }

    /**
     * Aggregates multiple commands.
     * @param {Cmd<TMsg> []} commands Array of commands.
     */
    // eslint-disable-next-line class-methods-use-this
    public batch (...commands: Cmd<TMsg> []): Cmd<TMsg> {
        return commands.flat();
    }

    /**
     * Command to call the subscriber.
     * @param {Sub<TMsg>} sub The subscriber function.
     */
    // eslint-disable-next-line class-methods-use-this
    public ofSub (sub: Sub<TMsg>): Cmd<TMsg> {
        return [sub];
    }

    /**
     * Provides functionalities to create commands from simple functions.
     */
    public ofFunc = {
        /**
        * Creates a command out of a simple function and maps the result.
        * @param task The function to call.
        * @param ofSuccess Creates the message to dispatch after a successful call of the task.
        * @param ofError Creates the message to dispatch when an error occurred.
        * @param args The parameters of the task.
        */
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

        /**
        * Creates a command out of a simple function and ignores the error case.
        * @param task The function to call.
        * @param ofSuccess Creates the message to dispatch after a successful call of the task.
        * @param args The parameters of the task.
        */
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

        /**
        * Creates a command out of a simple function and ignores the success case.
        * @param task The function to call.
        * @param ofError Creates the message to dispatch when an error occurred.
        * @param args The parameters of the task.
        */
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
    };

    /**
     * Provides functionalities to create commands from async functions.
     */
    public ofPromise = {
        /**
        * Creates a command out of an async function and maps the result.
        * @param task The async function to call.
        * @param ofSuccess Creates the message to dispatch when the promise is resolved.
        * @param ofError Creates the message to dispatch when the promise is rejected.
        * @param args The parameters of the task.
        */
        either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
            const bind = (dispatch: Dispatch<TMsg>): void => {
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

        /**
        * Creates a command out of an async function and ignores the success case.
        * @param task The async function to call.
        * @param ofError Creates the message to dispatch when the promise is rejected.
        * @param args The parameters of the task.
        */
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
    };
}

/**
 * Creates a typed instance of the Command class.
 * @template TMsg The type of the Msg discriminated union.
 * @see Command
 */
export function createCmd<TMsg> (): Command<TMsg> {
    return new Command<TMsg>();
}