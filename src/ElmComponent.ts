import { ElmComponentBase } from "./ElmComponentBase";
import { updateModel } from "./runUpdate";
import type { DisposeFunction, InitFunction, Message, UpdateFunction } from "./Types";

/**
 * Abstract class for a react class component using the Elmish pattern.
 * @export
 * @abstract
 * @class ElmComponent
 * @extends {Component<TProps, TModel>}
 * @template TModel The type of the model.
 * @template TMessage The type of the messages.
 * @template TProps The type of the props.
 */
abstract class ElmComponent<TModel, TMessage extends Message, TProps> extends ElmComponentBase<
	TModel,
	Readonly<TModel>,
	TMessage,
	TProps,
	UpdateFunction<TProps, TModel, TMessage>
> {
	/**
	 * Creates an instance of ElmComponent.
	 * @param {TProps} props The props for the component.
	 * @param {() => TModel} init The initializer function.
	 * @param name The name of the component.
	 * @param disposeHandler The optional function which is called with the current model when the component unmounts.
	 * @memberof ElmComponent
	 */
	public constructor(
		props: TProps,
		init: InitFunction<TProps, TModel, TMessage>,
		name: string,
		disposeHandler?: DisposeFunction<TModel>,
	) {
		super(props, init, name, (model) => model, updateModel, disposeHandler);
	}

	/**
	 * Function to modify the model based on a message.
	 * @param {TModel} model The current model.
	 * @param {TMessage} msg The message to process.
	 * @param {TProps} props The props of the component.
	 * @param options The options for the update function.
	 * @returns The new model (can also be an empty object {}) and an optional new message to dispatch.
	 * @abstract
	 * @memberof ElmComponent
	 */
	public abstract override update: UpdateFunction<TProps, TModel, TMessage>;
}

export { ElmComponent };
