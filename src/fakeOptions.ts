import type { Dispatch, Message, Nullable } from "./Types";

/**
 * Options for the `renderWithModel` function.
 * @interface RenderWithModelOptions
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
 * The options set by `renderWithModel`, including the model.
 * @interface RenderWithModelConfig
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
	claimedBy: Nullable<string>;
}

const State: FakeState = {
	currentFakeOptions: null,
	claimedBy: null,
};

/**
 * Sets the fake options for the components rendered next, or resets them with `null`.
 * @param options The fake options.
 */
function setFakeOptions<TModel extends object, TMessage extends Message>(
	options: Nullable<RenderWithModelConfig<TModel, TMessage>>,
): void {
	// biome-ignore lint/nursery/noUnsafeTypeAssertion: We must cast the type here.
	State.currentFakeOptions = options as RenderWithModelConfig<unknown, Message>;
	State.claimedBy = null;
}

/**
 * Returns the fake options for a component that is initializing.
 * The first component asking for them claims them by its name. Later calls with the same name
 * (e.g. the second render of React's StrictMode) get them too, components with other names (e.g. children) get `null`.
 * @param name The name of the initializing component.
 * @returns The fake options or `null`.
 */
function getFakeOptions<TModel, TMessage extends Message>(name: string): Nullable<RenderWithModelConfig<TModel, TMessage>> {
	if (!State.currentFakeOptions) {
		return null;
	}

	State.claimedBy ??= name;

	if (State.claimedBy !== name) {
		return null;
	}

	// biome-ignore lint/nursery/noUnsafeTypeAssertion: We must cast the type here.
	return State.currentFakeOptions as RenderWithModelConfig<TModel, TMessage>;
}

export type { RenderWithModelOptions };

export { getFakeOptions, setFakeOptions };
