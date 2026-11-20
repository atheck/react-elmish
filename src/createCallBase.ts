import type { CallBaseFunction, Message, UpdateFunctionOptions } from "./Types";

function createCallBase<TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: Omit<UpdateFunctionOptions<TProps, TModel, TMessage>, "callBase">,
): CallBaseFunction<TModel, TProps, TMessage> {
	const callBase: CallBaseFunction<TModel, TProps, TMessage> = (fn) =>
		// biome-ignore lint/nursery/noUnsafeTypeAssertion: The options are typed as never in CallBaseFunction, so the base handler may declare its own options type.
		fn(msg, model, props, { ...options, callBase } as never);

	return callBase;
}

export { createCallBase };
