import type { DeferFunction, Message, Nullable, UpdateMap, UpdateReturnType } from "../Types";
import { callUpdateMap } from "../useElmish";
import { execCmd } from "./execCmd";

/**
 * Creates an update function out of an UpdateMap.
 * @param {UpdateMap<TProps, TModel, TMessage>} updateMap The UpdateMap.
 * @returns {(msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage>} The created update function which can be used in tests.
 * @example
 * const updateFn = getUpdateFn(update);
 *
 * // in your tests:
 * const [model, cmd] = updateFn(...args);
 */
function getUpdateFn<TProps, TModel, TMessage extends Message>(
	updateMap: UpdateMap<TProps, TModel, TMessage>,
): (msg: TMessage, model: TModel, props: TProps, defer: DeferFunction<TModel, TMessage>) => UpdateReturnType<TModel, TMessage> {
	return function updateFn(msg, model, props, defer): UpdateReturnType<TModel, TMessage> {
		return callUpdateMap(updateMap, msg, model, props, defer);
	};
}

/**
 * Creates an update function out of an UpdateMap which immediately executes the command.
 * @param {UpdateMap<TProps, TModel, TMessage>} updateMap The UpdateMap.
 * @returns {(msg: TMessage, model: TModel, props: TProps) => Promise<[Partial<TModel>, Nullable<TMessage> []]>} The created update function which can be used in tests.
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
	defer: DeferFunction<TModel, TMessage>,
) => Promise<[Partial<TModel>, Nullable<TMessage>[]]> {
	return async function updateAndExecCmdFn(msg, model, props, defer): Promise<[Partial<TModel>, Nullable<TMessage>[]]> {
		const [updatedModel, ...commands] = callUpdateMap(updateMap, msg, model, props, defer);

		const messages = await execCmd(...commands);

		return [updatedModel, messages];
	};
}

export { getUpdateAndExecCmdFn, getUpdateFn };
