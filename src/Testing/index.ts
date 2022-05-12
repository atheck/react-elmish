import { MessageBase, Nullable, UpdateMap, UpdateReturnType } from "../Types";
import { callUpdateMap } from "../useElmish";
import { Cmd } from "../Cmd";

/**
 * Extracts the messages out of a command.
 * @param cmd The command to process.
 * @returns The array of messages.
 */
function getOfMsgParams<TMsg> (cmd?: Cmd<TMsg>): TMsg [] {
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
async function execCmd<TMsg> (cmd?: Cmd<TMsg>): Promise<Nullable<TMsg> []> {
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

function getUpdateFn<TProps, TModel, TMessage extends MessageBase> (updateMap: UpdateMap<TProps, TModel, TMessage>): (msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage> {
    return function (msg: TMessage, model: TModel, props: TProps): UpdateReturnType<TModel, TMessage> {
        return callUpdateMap(updateMap, msg, model, props);
    };
}

export {
    getOfMsgParams,
    execCmd,
    getUpdateFn,
};