import { callUpdate, createUpdateOptions } from "./callUpdate";
import { hasModelChanged } from "./Common";
import { createDefer } from "./createDefer";
import type { Commands, Message, UpdateFunction, UpdateFunctionOptions, UpdateMap, UpdateReturnType } from "./Types";

/**
 * An UpdateMap or an update function.
 */
type Update<TProps, TModel, TMessage extends Message> =
	| UpdateFunction<TProps, TModel, TMessage>
	| UpdateMap<TProps, TModel, TMessage>;

/**
 * Runs the update for a message, including the deferred model changes and commands.
 * The handlers get a shallow copy of the model, so reassigning a property of the model without returning it has no effect.
 * @param update The UpdateMap or update function.
 * @param msg The message to process.
 * @param model The current model.
 * @param props The current props.
 * @param optionsTemplate Overrides for the options passed to the update handler (used in tests).
 * @returns The model changes and the commands.
 */
function runUpdate<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
	msg: TMessage,
	model: TModel,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
): UpdateReturnType<TModel, TMessage> {
	const [defer, getDeferred] = createDefer<TModel, TMessage>();
	const modelCopy = { ...model };
	const options = createUpdateOptions<"mutable", TProps, TModel, TMessage>(msg, modelCopy, props, defer, optionsTemplate);

	const [updatedModel, ...commands] = callUpdate<"mutable", TProps, TModel, TMessage>(update, msg, modelCopy, props, options);

	const [deferredModel, deferredCommands] = getDeferred();

	return [{ ...deferredModel, ...updatedModel }, ...commands, ...deferredCommands];
}

/**
 * Runs the update for a message and applies the changes to the model.
 * @returns The updated model (the same reference, if nothing has changed) and the commands.
 */
function updateModel<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
	msg: TMessage,
	model: TModel,
	props: TProps,
): [TModel, ...Commands<TMessage>] {
	const [changes, ...commands] = runUpdate(update, msg, model, props);

	return [hasModelChanged(changes) ? { ...model, ...changes } : model, ...commands];
}

/**
 * The mutable variant stores the model as it is.
 */
function toStoredModel<TModel>(model: TModel): TModel {
	return model;
}

/**
 * The model handling of the mutable variant, used by `useElmish` and `ElmComponent`.
 */
const modelHandling = { toStoredModel, updateModel };

export type { Update };

export { modelHandling, runUpdate };
