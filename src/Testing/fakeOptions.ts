import { Dispatch, Message, Nullable } from "../Types";

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
interface RenderWithModelConfig<TModel, TMessage extends Message>
	extends RenderWithModelOptions<TMessage> {
	/**
	 * The model to use when rendering the component.
	 * @type {TModel}
	 */
	model: TModel;
}

let currentFakeOptions: Nullable<RenderWithModelConfig<unknown, Message>>;

function setFakeOptions<TModel extends object, TMessage extends Message>(
	options: Nullable<RenderWithModelConfig<TModel, TMessage>>,
): void {
	currentFakeOptions = options as RenderWithModelConfig<unknown, Message>;
}

function getFakeOptionsOnce<TModel, TMessage extends Message>(): Nullable<
	RenderWithModelConfig<TModel, TMessage>
> {
	const temp = currentFakeOptions;

	currentFakeOptions = null;

	return temp as RenderWithModelConfig<TModel, TMessage>;
}

export type { RenderWithModelOptions };

export { getFakeOptionsOnce, setFakeOptions };
