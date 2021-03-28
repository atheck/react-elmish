/**
 * Type of the dispatch function.
 */
export type Dispatch<TMsg> = (msg: TMsg) => void;

type Sub<TMsg> = (dispatch: Dispatch<TMsg>) => void;

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
    none = [];

    /**
     * Creates a command out of a specific message.
     * @param {TMsg} msg The specific message.
     */
    ofMsg(msg: TMsg): Cmd<TMsg> {
        return [dispatch => dispatch(msg)];
    }

    /**
     * Aggregates multiple commands.
     * @param {Cmd<TMsg> []} commands Array of commands.
     */
    batch(...commands: Cmd<TMsg> []): Cmd<TMsg> {
        const result: Cmd<TMsg> = [];

        return result.concat(...commands);
    }

    /**
     * Provides functionalities to create commands from simple functions.
     */
    ofFunc = {
        /**
        * Creates a command out of a simple function and maps the result.
        * @param task The function to call.
        * @param ofSuccess Creates the message to dispatch after a successful call of the task.
        * @param ofError Creates the message to dispatch when an error occurred.
        * @param args The parameters of the task.
        */
        either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
            const bind = (dispatch: Dispatch<TMsg>) => {
                try {
                    const result = task(...args);

                    dispatch(ofSuccess(result));
                } catch (error) {
                    dispatch(ofError(error));
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
            const bind = (dispatch: Dispatch<TMsg>) => {
                try {
                    const result = task(...args);

                    dispatch(ofSuccess(result));
                } catch {}
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
            const bind = (dispatch: Dispatch<TMsg>) => {
                try {
                    task(...args);
                } catch (error) {
                    dispatch(ofError(error));
                }
            };

            return [bind];
        },
    };

    /**
     * Provides functionalities to create commands from async functions.
     */
    ofPromise = {
        /**
        * Creates a command out of an async function and maps the result.
        * @param task The async function to call.
        * @param ofSuccess Creates the message to dispatch when the promise is resolved.
        * @param ofError Creates the message to dispatch when the promise is rejected.
        * @param args The parameters of the task.
        */
        either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
            const bind = (dispatch: Dispatch<TMsg>) => {
                task(...args).then(result => dispatch(ofSuccess(result))).catch(error => dispatch(ofError(error)));
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
            const bind = (dispatch: Dispatch<TMsg>) => {
                task(...args).then(result => dispatch(ofSuccess(result))).catch(() => undefined);
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
            const bind = (dispatch: Dispatch<TMsg>) => {
                task(...args).catch(error => dispatch(ofError(error)));
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
export const createCmd = <TMsg>(): Command<TMsg> => {
    return new Command<TMsg>();
};