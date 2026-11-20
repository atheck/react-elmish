import React from "react";
import { execCmd, getDispatch, logMessage } from "./Common";
import { getFakeOptions } from "./fakeOptions";
import { Services } from "./Init";
import type { Commands, Dispatch, DisposeFunction, InitFunction, Message, Nullable } from "./Types";

/**
 * Runs the update for a message.
 * @returns The updated model (the same reference, if nothing has changed) and the commands.
 */
type UpdateModelFunction<TProps, TStoredModel, TMessage extends Message, TUpdate> = (
	update: TUpdate,
	msg: TMessage,
	model: TStoredModel,
	props: TProps,
) => [TStoredModel, ...Commands<TMessage>];

/**
 * The implementation of `ElmComponent`, shared by the mutable and the immutable variant.
 * @template TModel The type of the model returned by `init`.
 * @template TStoredModel The type of the model which is stored and passed to `update`.
 * @template TMessage The type of the messages.
 * @template TProps The type of the props.
 * @template TUpdate The type of the `update` function.
 */
// biome-ignore lint/style/useReactFunctionComponents: This is only for downward compatibility.
abstract class ElmComponentBase<TModel, TStoredModel, TMessage extends Message, TProps, TUpdate> extends React.Component<TProps> {
	/**
	 * Dispatches a message.
	 * @param {TMessage} msg The message to dispatch.
	 * @memberof ElmComponent
	 */
	public readonly dispatch: Dispatch<TMessage>;

	readonly #disposeHandler: DisposeFunction<TStoredModel> | undefined;
	readonly #initialize: () => void;
	#initCommands: Nullable<Commands<TMessage>> = null;
	#isMounted = false;
	#isDisposed = false;
	// Assigned by #initialize, which is called in the constructor.
	#currentModel!: TStoredModel;

	protected constructor(
		props: TProps,
		init: InitFunction<TProps, TModel, TMessage>,
		name: string,
		toStoredModel: (model: TModel) => TStoredModel,
		updateModel: UpdateModelFunction<TProps, TStoredModel, TMessage, TUpdate>,
		disposeHandler?: DisposeFunction<TStoredModel>,
	) {
		super(props);

		const fakeOptions = getFakeOptions<TModel, TMessage>(name);

		this.#disposeHandler = disposeHandler;
		this.#initialize = (): void => {
			const [model, ...commands] = fakeOptions?.model ? [fakeOptions.model] : init(this.props);

			Services.logger?.debug("Initial model for", name, model);

			this.#currentModel = toStoredModel(model);
			this.#initCommands = commands;
		};

		this.#initialize();

		this.dispatch = getDispatch(
			(msg: TMessage): boolean => {
				logMessage(name, msg);

				const [updatedModel, ...updateCommands] = updateModel(this.update, msg, this.#currentModel, this.props);
				const isModified = updatedModel !== this.#currentModel;

				this.#currentModel = updatedModel;

				execCmd(this.dispatch, ...updateCommands);

				return isModified;
			},
			() => {
				if (!this.#isMounted) {
					return;
				}

				Services.logger?.debug("Update model for", name, this.#currentModel);
				this.forceUpdate();
			},
			undefined,
			fakeOptions?.dispatch,
		);
	}

	/**
	 * Is called when the component is loaded.
	 * When implementing this method, the base implementation has to be called.
	 * @memberof ElmComponent
	 */
	public componentDidMount(): void {
		this.#isMounted = true;

		// When React mounts the component again (e.g. in StrictMode) after the model has been disposed, we initialize it again.
		if (this.#isDisposed) {
			this.#isDisposed = false;
			this.#initialize();
			this.forceUpdate();
		}

		const initCommands = this.#initCommands;

		this.#initCommands = null;

		if (initCommands) {
			execCmd(this.dispatch, ...initCommands);
		}
	}

	/**
	 * Is called before unloading the component.
	 * When implementing this method, the base implementation has to be called.
	 * @memberof ElmComponent
	 */
	public componentWillUnmount(): void {
		this.#isMounted = false;

		if (!this.#disposeHandler) {
			return;
		}

		this.#disposeHandler(this.#currentModel);
		this.#isDisposed = true;
	}

	/**
	 * Returns the current model.
	 * @readonly
	 * @memberof ElmComponent
	 */
	// eslint-disable-next-line react/no-unused-class-component-members -- We need it internally.
	public get model(): TStoredModel {
		return this.#currentModel;
	}

	/**
	 * Function to modify the model based on a message.
	 * @abstract
	 * @memberof ElmComponent
	 */
	public abstract update: TUpdate;
}

export { ElmComponentBase };
