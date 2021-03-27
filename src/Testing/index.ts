import { Cmd } from "../Cmd";

/**
 * Executes a single command created by one of the ofPromise functions.
 * @param cmd The command to process.
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