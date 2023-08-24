import { Services } from "./Init";
import { Cmd, Dispatch, Message } from "./Types";

function logMessage<TMessage extends Message>(name: string, msg: TMessage): void {
	Services.logger?.info("Message from", name, msg.name);
	Services.logger?.debug("Message from", name, msg);

	Services.dispatchMiddleware?.(msg);
}

function modelHasChanged<TModel>(currentModel: TModel, model: Partial<TModel>): boolean {
	return !Object.is(model, currentModel) && Object.getOwnPropertyNames(model).length > 0;
}

function execCmd<TMessage>(dispatch: Dispatch<TMessage>, ...commands: (Cmd<TMessage> | undefined)[]): void {
	for (const call of commands.flat()) {
		if (call) {
			call(dispatch);
		}
	}
}

export { execCmd, logMessage, modelHasChanged };
