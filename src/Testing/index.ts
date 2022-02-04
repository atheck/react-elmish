import { Cmd } from "../Cmd";
import { Nullable } from "../ElmUtilities";

/**
 * Executes a single command created by one of the ofPromise functions.
 * @param cmd The command to process.
 * @deprecated Use execCmd instead.
 */
export async function runSingleOfPromiseCmd<TMsg> (cmd: Cmd<TMsg>): Promise<void> {
    return new Promise<void>(resolve => {
        const dispatch = (): void => resolve();

        cmd[0](dispatch);
    });
}

/**
 * Extracts the messages out of a command.
 * @param cmd The command to process.
 * @returns The array of messages.
 */
export function getOfMsgParams<TMsg> (cmd?: Cmd<TMsg>): TMsg [] {
    const msgNames: TMsg [] = [];

    const dispatch = (msg: TMsg): void => {
        msgNames.push(msg);
    };

    cmd?.map(currentCmd => currentCmd(dispatch));

    return msgNames;
}

/**
 * Executes all commands and resolves the messages.
 * @param cmd The command to process.
 * @returns The array of processed messages.
 */
export async function execCmd<TMsg> (cmd?: Cmd<TMsg>): Promise<Nullable<TMsg> []> {
    if (!cmd) {
        return [];
    }

    const callers = cmd.map(async currentCmd => new Promise<Nullable<TMsg>>((resolve, reject) => {
        const dispatch = (msg: TMsg): void => resolve(msg);

        currentCmd(dispatch, error => {
            if (error) {
                reject(error);
            } else {
                resolve(null);
            }
        });
    }));

    const results = await Promise.all(callers);

    return results;
}