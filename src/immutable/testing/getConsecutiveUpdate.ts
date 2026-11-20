import type { Immutable } from "immer";
import type { Message } from "../../Types";
import { createConsecutiveUpdateFn } from "../../testing/getConsecutiveUpdate";
import type { Update } from "../runUpdate";
import type { UpdateFunctionOptions } from "../Types";
import { getUpdateAndExecCmdFn } from "./getUpdateFn";

/**
 * Creates an update function out of an UpdateMap or an update function which executes all consecutive commands.
 * @param update The UpdateMap or update function.
 * @returns The created update function which can be used in tests.
 * @example
 * const consecutiveUpdate = getConsecutiveUpdateFn(update);
 *
 * // in your test:
 * const model = await consecutiveUpdate(...args);
 */
function getConsecutiveUpdateFn<TProps, TModel, TMessage extends Message>(
	update: Update<TProps, TModel, TMessage>,
): (
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
) => Promise<Partial<TModel>> {
	return createConsecutiveUpdateFn(getUpdateAndExecCmdFn(update));
}

export { getConsecutiveUpdateFn };
