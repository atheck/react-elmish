import { produce, type Draft, type Immutable } from "immer";
import type { Message } from "../Types";
import type { CallBaseFunction, UpdateFunctionOptions, UpdateReturnType } from "./Types";

function createCallBase<TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	options: Omit<UpdateFunctionOptions<TProps, TModel, TMessage>, "callBase">,
): CallBaseFunction<TModel, TProps, TMessage> {
	const callBase: CallBaseFunction<TModel, TProps, TMessage> = (fn) => {
		const commands: UpdateReturnType<TMessage> = [];
		const updatedModel = produce(model, (draft: Draft<TModel>) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The current TMessage must be extended from Message
			commands.push(...(fn(msg, draft, props, { ...options, callBase }) as UpdateReturnType<TMessage>));
		});

		return [updatedModel, commands];
	};

	return callBase;
}

export { createCallBase };
