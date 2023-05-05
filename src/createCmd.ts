import { cmd } from "./cmd";
import { Cmd, Message, Sub } from "./Types";

/**
 * Contains functions to create commands.
 * @template TMessage Type of the Message discriminated union.
 */
interface Command<TMessage> {
    /**
     * Represents an empty command.
     * @deprecated Do return nothing (`undefined`) instead.
     */
    none: [],
    /**
     * Creates a command out of a specific message.
     * @param {TMessage} msg The specific message.
     */
    ofMsg: (msg: TMessage) => Cmd<TMessage>,
    /**
     * Aggregates multiple commands.
     * @param {Cmd<TMessage> []} commands Array of commands.
     */
    batch: (...commands: (Cmd<TMessage> | undefined | null) []) => Cmd<TMessage>,
    /**
     * Command to call the subscriber.
     * @param {Sub<TMessage>} sub The subscriber function.
     */
    ofSub: (sub: Sub<TMessage>) => Cmd<TMessage>,
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
        either: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMessage, ofError: (error: Error) => TMessage, ...args: TArgs) => Cmd<TMessage>,
        /**
        * Creates a command out of a simple function and ignores the error case.
        * @param task The function to call.
        * @param ofSuccess Creates the message to dispatch after a successful call of the task.
        * @param args The parameters of the task.
        */
        perform: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMessage, ...args: TArgs) => Cmd<TMessage>,
        /**
        * Creates a command out of a simple function and ignores the success case.
        * @param task The function to call.
        * @param ofError Creates the message to dispatch when an error occurred.
        * @param args The parameters of the task.
        */
        attempt: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofError: (error: Error) => TMessage, ...args: TArgs) => Cmd<TMessage>,
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
        either: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMessage, ofError: (error: Error) => TMessage, ...args: TArgs) => Cmd<TMessage>,
        /**
        * Creates a command out of an async function and ignores the error case.
        * @param task The async function to call.
        * @param ofSuccess Creates the message to dispatch when the promise is resolved.
        * @param args The parameters of the task.
        */
        perform: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMessage, ...args: TArgs) => Cmd<TMessage>,
        /**
        * Creates a command out of an async function and ignores the success case.
        * @param task The async function to call.
        * @param ofError Creates the message to dispatch when the promise is rejected.
        * @param args The parameters of the task.
        */
        attempt: <TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofError: (error: Error) => TMessage, ...args: TArgs) => Cmd<TMessage>,
    },
}

/**
 * Creates a typed instance of the Command class.
 * @template TMessage The type of the Msg discriminated union.
 * @deprecated Import the `cmd` object and use this instead.
 */
function createCmd<TMessage extends Message> (): Command<TMessage> {
    return {
        none: [],
        ofMsg (msg: TMessage): Cmd<TMessage> {
            return cmd.ofMsg(msg);
        },
        batch (...commands: (Cmd<TMessage> | undefined | null) []): Cmd<TMessage> {
            return cmd.batch(...commands);
        },
        ofSub (sub: Sub<TMessage>): Cmd<TMessage> {
            return cmd.ofSub(sub);
        },
        ofFunc: {
            either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMessage, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
                return cmd.ofFunc.either(task, ofSuccess, ofError, ...args);
            },
            perform<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMessage, ...args: TArgs): Cmd<TMessage> {
                return cmd.ofFunc.perform(task, ofSuccess, ...args);
            },
            attempt<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
                return cmd.ofFunc.attempt(task, ofError, ...args);
            },
        },
        ofPromise: {
            either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMessage, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
                return cmd.ofPromise.either(task, ofSuccess, ofError, ...args);
            },
            perform<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMessage, ...args: TArgs): Cmd<TMessage> {
                return cmd.ofPromise.perform(task, ofSuccess, ...args);
            },
            attempt<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
                return cmd.ofPromise.attempt(task, ofError, ...args);
            },
        },
    };
}

export {
    createCmd,
};