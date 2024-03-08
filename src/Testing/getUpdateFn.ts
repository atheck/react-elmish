import type { Message, Nullable, UpdateFunctionOptions, UpdateMap, UpdateReturnType } from "../Types";
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
): (
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: UpdateFunctionOptions<TModel, TMessage>,
) => UpdateReturnType<TModel, TMessage> {
	return function updateFn(msg, model, props, options): UpdateReturnType<TModel, TMessage> {
		return callUpdateMap(updateMap, msg, model, props, options);
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
	model: TModel,
	props: TProps,
	options: UpdateFunctionOptions<TModel, TMessage>,
) => Promise<[Partial<TModel>, Nullable<TMessage>[]]> {
	return async function updateAndExecCmdFn(msg, model, props, options): Promise<[Partial<TModel>, Nullable<TMessage>[]]> {
		const [updatedModel, ...commands] = callUpdateMap(updateMap, msg, model, props, options);

		const messages = await execCmd(...commands);

		return [updatedModel, messages];
	};
}

export { getUpdateAndExecCmdFn, getUpdateFn };
