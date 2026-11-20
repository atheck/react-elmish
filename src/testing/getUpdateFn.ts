import { runUpdate, type Update } from "../runUpdate";
import type { Message, Nullable, UpdateFunctionOptions, UpdateReturnType } from "../Types";
import { execCmd } from "./execCmd";

type UpdateFn<TProps, TModel, TMessage extends Message> = (
	msg: TMessage,
	model: TModel,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => UpdateReturnType<TModel, TMessage>;

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
		return runUpdate(update, msg, model, props, optionsTemplate);
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

export type { Update } from "../runUpdate";

export { getUpdateAndExecCmdFn, getUpdateFn };
