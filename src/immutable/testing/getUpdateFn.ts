import { type Draft, enablePatches, type Immutable, type Patch, produce } from "immer";
import type { Cmd, Message, Nullable } from "../../Types";
import { execCmd } from "../../testing";
import { createCallBase } from "../createCallBase";
import { createDefer } from "../createDefer";
import type { UpdateFunctionOptions, UpdateMap } from "../Types";
import { callUpdateMap } from "../useElmish";

// eslint-disable-next-line unicorn/no-top-level-side-effects
enablePatches();

/**
 * Creates an update function out of an UpdateMap.
 * @param updateMap The UpdateMap.
 * @returns The created update function which can be used in tests.
 * @example
 * const updateFn = getUpdateFn(update);
 *
 * // in your tests:
 * const [model, cmd] = updateFn(...args);
 */
function getUpdateFn<TProps, TModel, TMessage extends Message>(
	updateMap: UpdateMap<TProps, TModel, TMessage>,
): (
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => [Partial<TModel>, ...(Cmd<TMessage> | undefined)[]] {
	return function updateFn(msg, model, props, optionsTemplate): [Partial<TModel>, ...(Cmd<TMessage> | undefined)[]] {
		const [defer, getDeferred] = createDefer<TMessage>();
		const callBase = createCallBase(msg, model, props, { defer });

		const options: UpdateFunctionOptions<TProps, TModel, TMessage> = {
			defer,
			callBase,
			...optionsTemplate,
		};

		const commands: (Cmd<TMessage> | undefined)[] = [];
		const recordedPatches: Patch[] = [];
		const updatedModel = produce(
			model,
			(draft: Draft<TModel>) => {
				commands.push(...callUpdateMap(updateMap, msg, draft, props, options));
			},
			(patches) => {
				recordedPatches.push(...patches);
			},
		);
		const deferredCommands = getDeferred();

		const diff = getDiffFromPatches(recordedPatches, updatedModel);

		return [diff, ...commands, ...deferredCommands];
	};
}

/**
 * Creates an update function out of an UpdateMap which immediately executes the command.
 * @param updateMap The UpdateMap.
 * @returns The created update function which can be used in tests.
 * @example
 * const updateAndExecCmd = getUpdateAndExecCmdFn(update);
 *
 * // in your test:
 * const [model, messages] = await updateAndExecCmd(...args);
 */
function getUpdateAndExecCmdFn<TProps, TModel, TMessage extends Message>(
	updateMap: UpdateMap<TProps, TModel, TMessage>,
): (
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => Promise<[Partial<TModel>, Nullable<TMessage>[]]> {
	return async function updateAndExecCmdFn(msg, model, props, optionsTemplate): Promise<[Partial<TModel>, Nullable<TMessage>[]]> {
		const [defer, getDeferred] = createDefer<TMessage>();
		const callBase = createCallBase(msg, model, props, { defer });

		const options: UpdateFunctionOptions<TProps, TModel, TMessage> = {
			defer,
			callBase,
			...optionsTemplate,
		};

		const commands: (Cmd<TMessage> | undefined)[] = [];
		const recordedPatches: Patch[] = [];
		const updatedModel = produce(
			model,
			(draft: Draft<TModel>) => {
				commands.push(...callUpdateMap(updateMap, msg, draft, props, options));
			},
			(patches) => {
				recordedPatches.push(...patches);
			},
		);
		const deferredCommands = getDeferred();

		const diff = getDiffFromPatches(recordedPatches, updatedModel);

		const messages = await execCmd(...commands, ...deferredCommands);

		return [diff, messages];
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
		/* eslint-disable @typescript-eslint/no-dynamic-delete */
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
				delete diff[path];

				break;
			}
		}
		/* eslint-enable @typescript-eslint/no-dynamic-delete */
		/* eslint-enable @typescript-eslint/no-unsafe-assignment */
	}
}

export { getUpdateAndExecCmdFn, getUpdateFn };
