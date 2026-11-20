import { hasModelChanged } from "./Common";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import type { Commands, Message, UpdateFunction, UpdateFunctionOptions, UpdateMap, UpdateReturnType } from "./Types";

/**
 * An UpdateMap or an update function.
 */
type Update<TProps, TModel, TMessage extends Message> =
	| UpdateFunction<TProps, TModel, TMessage>
	| UpdateMap<TProps, TModel, TMessage>;

function callUpdate<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
): UpdateReturnType<TModel, TMessage> {
	if (typeof update === "function") {
		return update(model, msg, props, options);
	}

	const msgName: TMessage["name"] = msg.name;

	return update[msgName](msg, model, props, options);
}

/**
 * Runs the update for a message, including the deferred model changes and commands.
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
	const callBase = createCallBase(msg, model, props, { defer });

	const [updatedModel, ...commands] = callUpdate(update, msg, model, props, { defer, callBase, ...optionsTemplate });

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
	const [changes, ...commands] = runUpdate(update, msg, { ...model }, props);

	return [hasModelChanged(changes) ? { ...model, ...changes } : model, ...commands];
}

export type { Update };

export { runUpdate, updateModel };
