import { castImmutable, freeze, type Immutable } from "immer";
import type { InitFunction, Message } from "../../Types";
import { createModelAndProps as createMutableModelAndProps } from "../../testing/createModelAndProps";

function createModelAndProps<TProps, TModel, TMessage extends Message>(
	init: InitFunction<TProps, TModel, TMessage>,
	initProps: () => TProps,
	modelTemplate?: Partial<TModel>,
	propsTemplate?: Partial<TProps>,
): [Immutable<TModel>, TProps] {
	const [model, props] = createMutableModelAndProps(init, initProps, modelTemplate, propsTemplate);

	return [castImmutable(freeze(model, true)), props];
}

export { createModelAndProps };
