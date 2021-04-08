import { Cmd } from "../Cmd";

/**
 * Executes a single command created by one of the ofPromise functions.
 * @param cmd The command to process.
 * @deprecated Use execCmd instead.
 */
export const runSingleOfPromiseCmd = async <TMsg>(cmd: Cmd<TMsg>): Promise<void> => {
    return new Promise<void>((resolve) => {
        const dispatch = () => resolve();

        cmd[0](dispatch);
    });
};

/**
 * Extracts the messages out of a command.
 * @param cmd The command to process.
 * @returns The array of messages.
 */
export const getOfMsgParams = <TMsg>(cmd?: Cmd<TMsg>): TMsg [] => {
    const msgNames: TMsg [] = [];

    const dispatch = (msg: TMsg) => msgNames.push(msg);

    cmd?.map(c => c(dispatch));

    return msgNames;
};

/**
 * Executes all commands and resolves the messages.
 * @param cmd The command to process.
 * @returns The array of processed messages.
 */
export const execCmd = async <TMsg>(cmd?: Cmd<TMsg>): Promise<Nullable<TMsg> []> => {
    if (!cmd) {
        return Promise.resolve([]);
    }

    const callers = cmd.map(c => new Promise<Nullable<TMsg>>((resolve, reject) => {
        const dispatch = (msg: TMsg) => resolve(msg);

        c(dispatch, error => {
            if (error) {
                reject(error);
            } else {
                resolve(null);
            }
        });
    }));

    const results = await Promise.all(callers);

    return results;
};