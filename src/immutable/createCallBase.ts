import type { Draft } from "immer";
import { createVariantCallBase } from "../createCallBase";
import type { Message } from "../Types";
import type { CallBaseFunction, UpdateFunctionOptions } from "./Types";

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
	return createVariantCallBase<"immutable", TProps, TModel, TMessage>(msg, draft, props, options);
}

export { createCallBase };
