import type { Draft } from "immer";
import type { Message } from "../Types";
import type { CallBaseFunction, UpdateFunctionOptions, UpdateReturnType } from "./Types";

/**
 * Creates the `callBase` function for an update handler.
 * The base handler runs on the same draft as the calling handler, so its model changes are applied to the component model.
 * @param msg The current message.
 * @param draft The draft of the model the current update is working on.
 * @param props The current props.
 * @param options The options passed to the update handler, without `callBase`.
 * @returns The `callBase` function, which returns the commands of the base handler.
 */
function createCallBase<TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	draft: Draft<TModel>,
	props: TProps,
	options: Omit<UpdateFunctionOptions<TProps, TModel, TMessage>, "callBase">,
): CallBaseFunction<TModel, TProps, TMessage> {
	const callBase: CallBaseFunction<TModel, TProps, TMessage> = (fn) =>
		// biome-ignore lint/nursery/noUnsafeTypeAssertion: The current TMessage must be extended from Message.
		fn(msg, draft, props, { ...options, callBase }) as UpdateReturnType<TMessage>;

	return callBase;
}

export { createCallBase };
