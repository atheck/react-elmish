import { castImmutable, freeze, type Immutable } from "immer";
import type { InitFunction, Message } from "../../Types";

function createModelAndProps<TProps, TModel, TMessage extends Message>(
	init: InitFunction<TProps, TModel, TMessage>,
	initProps: () => TProps,
	modelTemplate?: Partial<TModel>,
	propsTemplate?: Partial<TProps>,
): [Immutable<TModel>, TProps] {
	const props: TProps = {
		...initProps(),
		...propsTemplate,
	};
	const [model] = init(props);

	return [castImmutable(freeze({ ...model, ...modelTemplate }, true)), props];
}

export { createModelAndProps };
