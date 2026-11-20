import type { BaseHandler, CallBaseFunction, DeferFunction, Message, UpdateFunctionOptions, UpdateReturnType } from "./Types";

function createCallBase<TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: Omit<UpdateFunctionOptions<TProps, TModel, TMessage>, "callBase">,
): CallBaseFunction<TModel, TProps, TMessage> {
	const callBase = <TBaseMessage extends Message>(
		fn: BaseHandler<TModel, TProps, TMessage, TBaseMessage>,
	): UpdateReturnType<TModel, TBaseMessage> => {
		// biome-ignore lint/nursery/noUnsafeTypeAssertion: The base handler defers its own messages, which must be part of the messages of the calling component.
		const defer = options.defer as unknown as DeferFunction<TModel, TBaseMessage>;

		return fn(msg, model, props, { ...options, defer, callBase });
	};

	return callBase;
}

export { createCallBase };
