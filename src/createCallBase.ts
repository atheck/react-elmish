import type { Message, UpdateFunctionOptions, UpdateMapFunction, UpdateReturnType } from "./Types";

function createCallBase<TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: Omit<UpdateFunctionOptions<TProps, TModel, TMessage>, "callBase">,
): (fn: UpdateMapFunction<TProps, TModel, TMessage>) => UpdateReturnType<TModel, TMessage> {
	const callBase = (fn: UpdateMapFunction<TProps, TModel, TMessage>): UpdateReturnType<TModel, TMessage> =>
		fn(msg, model, props, { ...options, callBase });

	return callBase;
}

export { createCallBase };
