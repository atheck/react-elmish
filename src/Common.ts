import { Cmd, Dispatch } from "./Cmd";
import { Services } from "./Init";
import { MessageBase } from "./Types";

function logMessage<TMessage extends MessageBase> (name: string, msg: TMessage): void {
    Services.logger?.info("Elm", "message from", name, msg.name);
    Services.logger?.debug("Elm", "message from", name, msg);

    Services.dispatchMiddleware?.(msg);
}

function modelHasChanged<TModel> (currentModel: TModel, model: Partial<TModel>): boolean {
    return !Object.is(model, currentModel) && Object.getOwnPropertyNames(model).length > 0;
}

function execCmd<TMessage> (cmd: Cmd<TMessage>, dispatch: Dispatch<TMessage>): void {
    cmd.forEach(call => call(dispatch));
}

export {
    logMessage,
    modelHasChanged,
    execCmd,
};