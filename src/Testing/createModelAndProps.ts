import { createCallBase } from "../createCallBase";
import { createDefer } from "../createDefer";
import type { InitFunction, Message, UpdateFunctionOptions } from "../Types";

function createModelAndProps<TProps, TModel, TMessage extends Message>(
	init: InitFunction<TProps, TModel, TMessage>,
	initProps: () => TProps,
	modelTemplate?: Partial<TModel>,
	propsTemplate?: Partial<TProps>,
): [TModel, TProps] {
	const props: TProps = {
		...initProps(),
		...propsTemplate,
	};
	const [model] = init(props);

	return [{ ...model, ...modelTemplate }, props];
}

function createOptions<TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: TModel,
	props: TProps,
	optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
): UpdateFunctionOptions<TProps, TModel, TMessage> {
	const defer = optionsTemplate?.defer ?? createDefer<TModel, TMessage>()[0];

	return {
		callBase: createCallBase(msg, model, props, { defer }),
		defer,
		...optionsTemplate,
	};
}

export { createModelAndProps, createOptions };
