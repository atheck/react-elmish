import React from "react";
import { execCmd, getDispatch, logMessage } from "./Common";
import { getFakeOptions } from "./fakeOptions";
import { Services } from "./Init";
import type { Cmd, Dispatch, DisposeFunction, InitFunction, Message, Nullable } from "./Types";

/**
 * Runs the update for a message.
 * @returns The updated model (the same reference, if nothing has changed) and the commands.
 */
type UpdateModelFunction<TProps, TStoredModel, TMessage extends Message, TUpdate> = (
	update: TUpdate,
	msg: TMessage,
	model: TStoredModel,
	props: TProps,
) => [TStoredModel, ...(Cmd<TMessage> | undefined)[]];

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

	private initCommands: Nullable<(Cmd<TMessage> | undefined)[]>;
	private mounted = false;
	private currentModel: TStoredModel;

	protected constructor(
		props: TProps,
		init: InitFunction<TProps, TModel, TMessage>,
		name: string,
		toStoredModel: (model: TModel) => TStoredModel,
		updateModel: UpdateModelFunction<TProps, TStoredModel, TMessage, TUpdate>,
		private readonly disposeHandler?: DisposeFunction<TStoredModel>,
	) {
		super(props);

		const fakeOptions = getFakeOptions<TModel, TMessage>(name);
		const [model, ...commands] = fakeOptions?.model ? [fakeOptions.model] : init(this.props);

		Services.logger?.debug("Initial model for", name, model);

		this.currentModel = toStoredModel(model);
		this.initCommands = commands;

		this.dispatch = getDispatch(
			(msg: TMessage): boolean => {
				logMessage(name, msg);

				const [updatedModel, ...updateCommands] = updateModel(this.update, msg, this.currentModel, this.props);
				const isModified = updatedModel !== this.currentModel;

				this.currentModel = updatedModel;

				execCmd(this.dispatch, ...updateCommands);

				return isModified;
			},
			() => {
				if (!this.mounted) {
					return;
				}

				Services.logger?.debug("Update model for", name, this.currentModel);
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
		this.mounted = true;

		if (!this.initCommands) {
			return;
		}

		execCmd(this.dispatch, ...this.initCommands);
		this.initCommands = null;
	}

	/**
	 * Is called before unloading the component.
	 * When implementing this method, the base implementation has to be called.
	 * @memberof ElmComponent
	 */
	public componentWillUnmount(): void {
		this.disposeHandler?.(this.currentModel);
		this.mounted = false;
	}

	/**
	 * Returns the current model.
	 * @readonly
	 * @memberof ElmComponent
	 */
	// eslint-disable-next-line react/no-unused-class-component-members -- We need it internally.
	public get model(): TStoredModel {
		return this.currentModel;
	}

	/**
	 * Function to modify the model based on a message.
	 * @abstract
	 * @memberof ElmComponent
	 */
	public abstract update: TUpdate;
}

export { ElmComponentBase };
