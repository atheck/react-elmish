import { type Draft, type Immutable, type PatchListener, produce } from "immer";
import type { Cmd, Message } from "../Types";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import type { UpdateFunction, UpdateFunctionOptions, UpdateMap, UpdateReturnType } from "./Types";

/**
 * An UpdateMap or an update function.
 */
type Update<TProps, TModel, TMessage extends Message> =
	| UpdateFunction<TProps, TModel, TMessage>
	| UpdateMap<TProps, TModel, TMessage>;

function callUpdate<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
	msg: TMessage,
	draft: Draft<TModel>,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
): UpdateReturnType<TMessage> {
	if (typeof update === "function") {
		return update(draft, msg, props, options);
	}

	const msgName: TMessage["name"] = msg.name;

	return update[msgName](msg, draft, props, options);
}

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
): [Immutable<TModel>, ...(Cmd<TMessage> | undefined)[]] {
	const [defer, getDeferred] = createDefer<TMessage>();
	const commands: UpdateReturnType<TMessage> = [];

	const updatedModel = produce(
		model,
		(draft: Draft<TModel>) => {
			const callBase = createCallBase(msg, draft, props, { defer });

			commands.push(...callUpdate(update, msg, draft, props, { defer, callBase, ...optionsTemplate }));
		},
		patchListener,
	);

	return [updatedModel, ...commands, ...getDeferred()];
}

export type { Update };

export { runUpdate };
