import { produce, type Draft, type Immutable } from "immer";
import { execCmd } from "../../testing";
import type { Cmd, Message, Nullable } from "../../Types";
import { createCallBase } from "../createCallBase";
import { createDefer } from "../createDefer";
import type { UpdateFunctionOptions, UpdateMap } from "../Types";
import { callUpdateMap } from "../useElmish";

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
		const [defer, getDeferred] = createDefer<TModel, TMessage>();
		const callBase = createCallBase(msg, model, props, { defer });

		const options: UpdateFunctionOptions<TProps, TModel, TMessage> = {
			defer,
			callBase,
			...optionsTemplate,
		};

		const [draftFn, ...commands] = callUpdateMap(updateMap, msg, model, props, options);
		const [deferredDraftFunctions, deferredCommands] = getDeferred();

		const allDraftFunctions = [...deferredDraftFunctions, draftFn].filter((fn) => fn != null);

		let currentModel = model;
		const diff: Partial<TModel> = {};

		for (const fn of allDraftFunctions) {
			currentModel = produce(currentModel, (draft) => {
				fn(draft);
				calculateModelDiff<TModel>(draft, model, diff);
			});
		}

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
		const [defer, getDeferred] = createDefer<TModel, TMessage>();
		const callBase = createCallBase(msg, model, props, { defer });

		const options: UpdateFunctionOptions<TProps, TModel, TMessage> = {
			defer,
			callBase,
			...optionsTemplate,
		};

		const [draftFn, ...commands] = callUpdateMap(updateMap, msg, model, props, options);
		const [deferredDraftFunctions, deferredCommands] = getDeferred();

		const allDraftFunctions = [draftFn, ...deferredDraftFunctions].filter((fn) => fn != null);

		let currentModel = model;
		const diff: Partial<TModel> = {};

		for (const fn of allDraftFunctions) {
			currentModel = produce(currentModel, (draft) => {
				fn(draft);
				calculateModelDiff<TModel>(draft, model, diff);
			});
		}

		const messages = await execCmd(...commands, ...deferredCommands);

		return [diff, messages];
	};
}

function calculateModelDiff<TModel>(draft: Draft<Immutable<TModel>>, model: Immutable<TModel>, diff: Partial<TModel>): void {
	for (const key in draft) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		if (Object.hasOwn(draft, key) && Object.hasOwn(model, key) && model[key] !== draft[key]) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			diff[key] = draft[key];
		}
	}
}

export { getUpdateAndExecCmdFn, getUpdateFn };
