import type { Update } from "../runUpdate";
import type { Message, Nullable, UpdateFunctionOptions } from "../Types";
import { getUpdateAndExecCmdFn } from "./getUpdateFn";

type ConsecutiveUpdateFn<TProps, TModel, TStoredModel, TMessage extends Message, TOptions> = (
	msg: TMessage,
	model: TStoredModel,
	props: TProps,
	optionsTemplate?: TOptions,
) => Promise<Partial<TModel>>;

/**
 * Creates a function which runs an update and the updates of all consecutive messages.
 * Shared by the mutable and the immutable variant.
 * @param updateAndExecCmdFn Runs a single update and executes its commands.
 * @returns The created update function.
 */
function createConsecutiveUpdateFn<TProps, TModel, TStoredModel, TMessage extends Message, TOptions>(
	updateAndExecCmdFn: (
		msg: TMessage,
		model: TStoredModel,
		props: TProps,
		optionsTemplate?: TOptions,
	) => Promise<[Partial<TModel>, Nullable<TMessage>[]]>,
): ConsecutiveUpdateFn<TProps, TModel, TStoredModel, TMessage, TOptions> {
	return async function consecutiveUpdateFn(msg, model, props, optionsTemplate): Promise<Partial<TModel>> {
		let messages: TMessage[] = [msg];
		let currentModel = model;
		let totalUpdatedModel: Partial<TModel> = {};

		while (messages.length > 0) {
			const currentMessages: Nullable<TMessage>[] = [];

			for (const nextMsg of messages) {
				// biome-ignore lint/performance/noAwaitInLoops: We need to await each update sequentially
				const [updatedModel, newMessages] = await updateAndExecCmdFn(nextMsg, currentModel, props, optionsTemplate);

				currentModel = { ...currentModel, ...updatedModel };
				totalUpdatedModel = { ...totalUpdatedModel, ...updatedModel };

				currentMessages.push(...newMessages);
			}

			messages = currentMessages.filter((message) => message != null);
		}

		return totalUpdatedModel;
	};
}

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
): ConsecutiveUpdateFn<TProps, TModel, TModel, TMessage, Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>> {
	return createConsecutiveUpdateFn(getUpdateAndExecCmdFn(update));
}

export { createConsecutiveUpdateFn, getConsecutiveUpdateFn };
