import { enablePatches, type Immutable, type Patch } from "immer";
import type { Cmd, Message, Nullable } from "../../Types";
import { execCmd } from "../../testing/execCmd";
import { runUpdate, type Update } from "../runUpdate";
import type { UpdateFunctionOptions } from "../Types";

enablePatches();

type UpdateFn<TProps, TModel, TMessage extends Message> = (
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => [Partial<TModel>, ...(Cmd<TMessage> | undefined)[]];

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

function getDiffFromPatches<TModel>(patches: Patch[], model: Immutable<TModel>): Partial<TModel> {
	const diff: Partial<TModel> = {};

	for (const patch of patches) {
		// biome-ignore lint/style/noNonNullAssertion: The path is always defined
		handleOp(patch.op, patch.path[0]!);
	}

	return diff;

	function handleOp(op: Patch["op"], path: string | number): void {
		/* eslint-disable @typescript-eslint/no-unsafe-assignment */
		switch (op) {
			case "replace": {
				// @ts-expect-error
				diff[path] = model[path];

				break;
			}
			case "add": {
				// @ts-expect-error
				diff[path] = model[path];

				break;
			}
			case "remove": {
				// @ts-expect-error
				// biome-ignore lint/nursery/noDynamicDelete: This for testing purposes.
				delete diff[path];

				break;
			}
		}
		/* eslint-enable @typescript-eslint/no-unsafe-assignment */
	}
}

export type { Update } from "../runUpdate";

export { getUpdateAndExecCmdFn, getUpdateFn };
