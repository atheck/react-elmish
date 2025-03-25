import type { Immutable } from "immer";
import type { CallBaseFunction, Message, UpdateFunctionOptions, UpdateReturnType } from "./Types";

function createCallBase<TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	options: Omit<UpdateFunctionOptions<TProps, TModel, TMessage>, "callBase">,
): CallBaseFunction<TModel, TProps, TMessage> {
	const callBase: CallBaseFunction<TModel, TProps, TMessage> = (fn) =>
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The current TMessage must be extended from Message
		fn(msg, model, props, { ...options, callBase }) as UpdateReturnType<TModel, TMessage>;

	return callBase;
}

export { createCallBase };
