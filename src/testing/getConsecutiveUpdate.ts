import { runUpdate, type Update } from "../runUpdate";
import type { Message, Nullable, UpdateFunctionOptions } from "../Types";
import { execCmd } from "./execCmd";

/**
 * Runs a single update and executes its commands.
 * @returns The updated model, which is passed to the next update, the model changes, and the dispatched messages.
 */
type UpdateStep<TModel, TStoredModel, TMessage extends Message, TArgs extends unknown[]> = (
	msg: TMessage,
	model: TStoredModel,
	...args: TArgs
) => Promise<[TStoredModel, Partial<TModel>, Nullable<TMessage>[]]>;

/**
 * Creates a function which runs an update and the updates of all consecutive messages.
 * Shared by the mutable and the immutable variant.
 * @param updateStep Runs a single update and executes its commands.
 * @returns The created update function, which returns all model changes.
 */
function createConsecutiveUpdateFn<TModel, TStoredModel, TMessage extends Message, TArgs extends unknown[]>(
	updateStep: UpdateStep<TModel, TStoredModel, TMessage, TArgs>,
): (msg: TMessage, model: TStoredModel, ...args: TArgs) => Promise<Partial<TModel>> {
	return async function consecutiveUpdateFn(msg, model, ...args): Promise<Partial<TModel>> {
		let messages: TMessage[] = [msg];
		let currentModel = model;
		let totalChanges: Partial<TModel> = {};

		while (messages.length > 0) {
			const currentMessages: Nullable<TMessage>[] = [];

			for (const nextMsg of messages) {
				// biome-ignore lint/performance/noAwaitInLoops: We need to await each update sequentially
				const [updatedModel, changes, newMessages] = await updateStep(nextMsg, currentModel, ...args);

				currentModel = updatedModel;
				totalChanges = { ...totalChanges, ...changes };

				currentMessages.push(...newMessages);
			}

			messages = currentMessages.filter((message) => message != null);
		}

		return totalChanges;
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
): (
	msg: TMessage,
	model: TModel,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => Promise<Partial<TModel>> {
	return createConsecutiveUpdateFn(async (msg: TMessage, model: TModel, props: TProps, optionsTemplate?) => {
		const [changes, ...commands] = runUpdate(update, msg, model, props, optionsTemplate);

		return [{ ...model, ...changes }, changes, await execCmd(...commands)];
	});
}

export { createConsecutiveUpdateFn, getConsecutiveUpdateFn };
