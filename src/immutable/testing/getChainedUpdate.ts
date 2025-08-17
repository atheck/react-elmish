import type { Immutable } from "immer";
import type { Message, Nullable } from "../../Types";
import type { UpdateFunctionOptions, UpdateMap } from "../Types";
import { getUpdateAndExecCmdFn } from "./getUpdateFn";

function getChainedUpdateFn<TProps, TModel, TMessage extends Message>(
	updateMap: UpdateMap<TProps, TModel, TMessage>,
): (
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => Promise<Partial<TModel>> {
	return async function chainedUpdateFn(msg, model, props, optionsTemplate): Promise<Partial<TModel>> {
		let messages: TMessage[] = [msg];
		let currentModel = model;
		let totalUpdatedModel: Partial<TModel> = {};

		const updatedAndExecFn = getUpdateAndExecCmdFn(updateMap);

		while (messages.length > 0) {
			const currentMessages: Nullable<TMessage>[] = [];

			for (const nextMsg of messages) {
				// biome-ignore lint/nursery/noAwaitInLoop: We need to await each update sequentially
				const [updatedModel, newMessages] = await updatedAndExecFn(nextMsg, currentModel, props, optionsTemplate);

				currentModel = { ...currentModel, ...updatedModel };
				totalUpdatedModel = { ...totalUpdatedModel, ...updatedModel };

				currentMessages.push(...newMessages);
			}

			messages = currentMessages.filter((message) => message != null);
		}

		return totalUpdatedModel;
	};
}

export { getChainedUpdateFn };
