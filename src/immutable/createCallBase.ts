import type { Draft } from "immer";
import type { Message } from "../Types";
import type { BaseHandler, CallBaseFunction, DeferFunction, UpdateFunctionOptions, UpdateReturnType } from "./Types";

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
	const callBase = <TBaseMessage extends Message>(
		fn: BaseHandler<TModel, TProps, TMessage, TBaseMessage>,
	): UpdateReturnType<TBaseMessage> => {
		// biome-ignore lint/nursery/noUnsafeTypeAssertion: The base handler defers its own messages, which must be part of the messages of the calling component.
		const defer = options.defer as unknown as DeferFunction<TBaseMessage>;

		return fn(msg, draft, props, { ...options, defer, callBase });
	};

	return callBase;
}

export { createCallBase };
