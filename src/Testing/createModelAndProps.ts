import type { InitFunction, Message } from "../Types";

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

export { createModelAndProps };
