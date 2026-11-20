import { enablePatches, type Immutable, type Patch } from "immer";
import type { Commands, Message, Nullable } from "../../Types";
import { execCmd } from "../../testing/execCmd";
import { runUpdate, type Update } from "../runUpdate";
import type { UpdateFunctionOptions } from "../Types";

enablePatches();

type UpdateFn<TProps, TModel, TMessage extends Message> = (
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => [Partial<TModel>, ...Commands<TMessage>];

type UpdateAndExecCmdFn<TProps, TModel, TMessage extends Message> = (
	...args: Parameters<UpdateFn<TProps, TModel, TMessage>>
) => Promise<[Partial<TModel>, Nullable<TMessage>[]]>;

/**
 * Creates an update function out of an UpdateMap or an update function.
 * @param update The UpdateMap or update function.
 * @returns The created update function which can be used in tests.
 * @example
 * const updateFn = getUpdateFn(update);
 *
 * // in your tests:
 * const [model, cmd] = updateFn(...args);
 */
function getUpdateFn<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
): UpdateFn<TProps, TModel, TMessage> {
	return function updateFn(msg, model, props, optionsTemplate) {
		const recordedPatches: Patch[] = [];
		const [updatedModel, ...commands] = runUpdate(update, msg, model, props, optionsTemplate, (patches) => {
			recordedPatches.push(...patches);
		});

		return [getDiffFromPatches(recordedPatches, updatedModel), ...commands];
	};
}

/**
 * Creates an update function out of an UpdateMap or an update function which immediately executes the command.
 * @param update The UpdateMap or update function.
 * @returns The created update function which can be used in tests.
 * @example
 * const updateAndExecCmd = getUpdateAndExecCmdFn(update);
 *
 * // in your test:
 * const [model, messages] = await updateAndExecCmd(...args);
 */
function getUpdateAndExecCmdFn<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
): UpdateAndExecCmdFn<TProps, TModel, TMessage> {
	const updateFn = getUpdateFn(update);

	return async function updateAndExecCmdFn(...args) {
		const [updatedModel, ...commands] = updateFn(...args);

		return [updatedModel, await execCmd(...commands)];
	};
}

/**
 * Computes the changed top level properties of the model from the patches of an update.
 * A removed top level property is included with the value `undefined`.
 * @param patches The patches of the update.
 * @param model The updated model.
 * @returns The changed top level properties.
 */
function getDiffFromPatches<TModel>(patches: Patch[], model: Immutable<TModel>): Partial<TModel> {
	const diff: Record<PropertyKey, unknown> = {};
	// biome-ignore lint/nursery/noUnsafeTypeAssertion: The model is always an object.
	const updatedModel = model as Record<PropertyKey, unknown>;

	for (const { op, path } of patches) {
		// biome-ignore lint/style/noNonNullAssertion: The patches of an object always have a path.
		const key = path[0]!;

		// A patch of a nested value changes the top level property, even if the nested value has been removed.
		diff[key] = op === "remove" && path.length === 1 ? undefined : updatedModel[key];
	}

	// biome-ignore lint/nursery/noUnsafeTypeAssertion: The diff only contains properties of the model.
	return diff as Partial<TModel>;
}

export type { Update } from "../runUpdate";

export { getUpdateAndExecCmdFn, getUpdateFn };
