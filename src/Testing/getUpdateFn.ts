import type { Message, Nullable, UpdateFunctionOptions, UpdateMap, UpdateReturnType } from "../Types";
import { createCallBase } from "../createCallBase";
import { createDefer } from "../createDefer";
import { callUpdateMap } from "../useElmish";
import { execCmd } from "./execCmd";

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
): (msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage> {
	return function updateFn(msg, model, props): UpdateReturnType<TModel, TMessage> {
		const [defer, getDeferred] = createDefer<TModel, TMessage>();
		const callBase = createCallBase(msg, model, props, { defer });

		const options: UpdateFunctionOptions<TProps, TModel, TMessage> = {
			defer,
			callBase,
		};

		const [updatedModel, ...commands] = callUpdateMap(updateMap, msg, model, props, options);

		const [deferredModel, deferredCommands] = getDeferred();

		return [{ ...deferredModel, ...updatedModel }, ...commands, ...deferredCommands];
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
): (msg: TMessage, model: TModel, props: TProps) => Promise<[Partial<TModel>, Nullable<TMessage>[]]> {
	return async function updateAndExecCmdFn(msg, model, props): Promise<[Partial<TModel>, Nullable<TMessage>[]]> {
		const [defer, getDeferred] = createDefer<TModel, TMessage>();
		const callBase = createCallBase(msg, model, props, { defer });

		const options: UpdateFunctionOptions<TProps, TModel, TMessage> = {
			defer,
			callBase,
		};

		const [updatedModel, ...commands] = callUpdateMap(updateMap, msg, model, props, options);

		const [deferredModel, deferredCommands] = getDeferred();

		const messages = await execCmd(...commands, ...deferredCommands);

		return [{ ...deferredModel, ...updatedModel }, messages];
	};
}

export { getUpdateAndExecCmdFn, getUpdateFn };
