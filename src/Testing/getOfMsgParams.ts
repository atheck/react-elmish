import { Cmd } from "../Types";

/**
 * Extracts the messages out of a command.
 * @param cmd The command to process.
 * @returns The array of messages.
 */
function getOfMsgParams<TMessage> (cmd?: Cmd<TMessage>): TMessage [] {
    const msgNames: TMessage [] = [];

    const dispatch = (msg: TMessage): void => {
        msgNames.push(msg);
    };

    cmd?.map(currentCmd => currentCmd(dispatch));

    return msgNames;
}

export {
    getOfMsgParams,
};