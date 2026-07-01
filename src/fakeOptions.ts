import type { Dispatch, Message, Nullable } from "./Types";

/**
 * Options for the `renderWithModel` function.
 * @interface RenderWithModelOptions
 * @template TModel The type of the model.
 * @template TMessage The type of the messages discriminated union.
 */
interface RenderWithModelOptions<TMessage extends Message> {
	/**
	 * A fake dispatch function to use when processing messages.
	 * @type {Dispatch<TMessage>}
	 */
	dispatch?: Dispatch<TMessage>;
}

/**
 * Options for the `renderWithModel` function.
 * @interface RenderWithModelOptions
 * @template TModel The type of the model.
 * @template TMessage The type of the messages discriminated union.
 */
interface RenderWithModelConfig<TModel, TMessage extends Message> extends RenderWithModelOptions<TMessage> {
	/**
	 * The model to use when rendering the component.
	 * @type {TModel}
	 */
	model: TModel;
}

interface FakeState {
	currentFakeOptions: Nullable<RenderWithModelConfig<unknown, Message>>;
}

const State: FakeState = {
	currentFakeOptions: null,
};

function setFakeOptions<TModel extends object, TMessage extends Message>(
	options: Nullable<RenderWithModelConfig<TModel, TMessage>>,
): void {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- We must cast the type here.
	State.currentFakeOptions = options as RenderWithModelConfig<unknown, Message>;
}

function getFakeOptionsOnce<TModel, TMessage extends Message>(): Nullable<RenderWithModelConfig<TModel, TMessage>> {
	const temp = State.currentFakeOptions;

	State.currentFakeOptions = null;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- We must cast the type here.
	return temp as RenderWithModelConfig<TModel, TMessage>;
}

export type { RenderWithModelOptions };

export { getFakeOptionsOnce, setFakeOptions };
