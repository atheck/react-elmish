import type { Immutable } from "immer";
import { ElmComponentBase } from "../ElmComponentBase";
import type { DisposeFunction, InitFunction, Message } from "../Types";
import { modelHandling } from "./runUpdate";
import type { UpdateFunction } from "./Types";

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
	Immutable<TModel>,
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
		disposeHandler?: DisposeFunction<Immutable<TModel>>,
	) {
		super(props, init, name, modelHandling, disposeHandler);
	}

	/**
	 * Function to modify the model based on a message.
	 * @param {Draft<TModel>} model The draft of the current model, which can be modified directly.
	 * @param {TMessage} msg The message to process.
	 * @param {TProps} props The props of the component.
	 * @param options The options for the update function.
	 * @returns Optional commands to execute.
	 * @abstract
	 * @memberof ElmComponent
	 */
	public abstract override update: UpdateFunction<TProps, TModel, TMessage>;
}

export { ElmComponent };
