import type { Immutable } from "immer";
import type { Message, Nullable } from "../../Types";
import type { UpdateFunctionOptions } from "../Types";
import { getUpdateAndExecCmdFn, type Update } from "./getUpdateFn";

/**
 * Creates an update function out of an UpdateMap or an update function which executes all consecutive commands.
 * @param update The UpdateMap or update function.
 * @returns The created update function which can be used in tests.
 * @example
 * const consecutiveUpdate = getConsecutiveUpdateFn(update);
 *
 * // in your test:
 * const model = await consecutiveUpdate(...args);
 */
function getConsecutiveUpdateFn<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
): (
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => Promise<Partial<TModel>> {
	return async function consecutiveUpdateFn(msg, model, props, optionsTemplate): Promise<Partial<TModel>> {
		let messages: TMessage[] = [msg];
		let currentModel = model;
		let totalUpdatedModel: Partial<TModel> = {};

		const updatedAndExecFn = getUpdateAndExecCmdFn(update);

		while (messages.length > 0) {
			const currentMessages: Nullable<TMessage>[] = [];

			for (const nextMsg of messages) {
				// biome-ignore lint/performance/noAwaitInLoops: We need to await each update sequentially
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

export { getConsecutiveUpdateFn };
