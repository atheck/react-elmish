import { castImmutable, type Draft, freeze, type Immutable, type PatchListener, produce } from "immer";
import { callUpdate, createUpdateOptions } from "../callUpdate";
import type { Commands, Message } from "../Types";
import { createDefer } from "./createDefer";
import type { Update, UpdateFunctionOptions, UpdateReturnType } from "./Types";

/**
 * Runs the update for a message on a draft of the model, including the deferred commands.
 * @param update The UpdateMap or update function.
 * @param msg The message to process.
 * @param model The current model.
 * @param props The current props.
 * @param optionsTemplate Overrides for the options passed to the update handler (used in tests).
 * @param patchListener Receives the patches of the update (used in tests, requires `enablePatches()`).
 * @returns The updated model (the same reference, if nothing has changed) and the commands.
 */
function runUpdate<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
	patchListener?: PatchListener,
): [Immutable<TModel>, ...Commands<TMessage>] {
	const [defer, getDeferred] = createDefer<TMessage>();
	const commands: UpdateReturnType<TMessage> = [];

	const updatedModel = produce(
		model,
		(draft: Draft<TModel>) => {
			const options = createUpdateOptions<"immutable", TProps, TModel, TMessage>(msg, draft, props, defer, optionsTemplate);

			commands.push(...callUpdate<"immutable", TProps, TModel, TMessage>(update, msg, draft, props, options));
		},
		patchListener,
	);

	return [updatedModel, ...commands, ...getDeferred()];
}

/**
 * The immutable variant stores the model deeply frozen.
 */
function toStoredModel<TModel>(model: TModel): Immutable<TModel> {
	return castImmutable(freeze(model, true));
}

/**
 * The model handling of the immutable variant, used by `useElmish` and `ElmComponent`.
 */
const modelHandling = { toStoredModel, updateModel: runUpdate };

export { modelHandling, runUpdate };
