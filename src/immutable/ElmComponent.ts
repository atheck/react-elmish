import { castImmutable, type Draft, freeze, type Immutable, produce } from "immer";
import React from "react";
import { execCmd, logMessage } from "../Common";
import { getFakeOptionsOnce } from "../fakeOptions";
import { Services } from "../Init";
import type { Cmd, DisposeFunction, InitFunction, Message, Nullable } from "../Types";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import type { UpdateFunction, UpdateReturnType } from "./Types";

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
// biome-ignore lint/style/useReactFunctionComponents: This is only for downward compatibility.
abstract class ElmComponent<TModel, TMessage extends Message, TProps> extends React.Component<TProps> {
	private initCommands: Nullable<(Cmd<TMessage> | undefined)[]> | undefined;
	private readonly componentName: string;
	private readonly buffer: TMessage[] = [];
	private running = false;
	private mounted = false;
	private currentModel: Immutable<TModel>;

	/**
	 * Creates an instance of ElmComponent.
	 * @param {TProps} props The props for the component.
	 * @param {() => TModel} init The initializer function.
	 * @param name The name of the component.
	 * @memberof ElmComponent
	 */
	public constructor(props: TProps, init: InitFunction<TProps, TModel, TMessage>, name: string, private readonly disposeHandler?: DisposeFunction<Immutable<TModel>>) {
		super(props);

		const fakeOptions = getFakeOptionsOnce<TModel, TMessage>();

		if (fakeOptions?.dispatch) {
			this.dispatch = fakeOptions.dispatch;
		}

		const [model, ...commands] = fakeOptions?.model ? [fakeOptions.model as TModel] : init(this.props);

		Services.logger?.debug("Initial model for", name, model);

		this.componentName = name;
		this.currentModel = castImmutable(freeze(model, true));
		this.initCommands = commands;
	}

	/**
	 * Is called when the component is loaded.
	 * When implementing this method, the base implementation has to be called.
	 * @memberof ElmComponent
	 */
	public componentDidMount(): void {
		this.mounted = true;

		if (this.initCommands) {
			execCmd(this.dispatch, ...this.initCommands);
			this.initCommands = null;
		}
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
	 * @type {Readonly<TModel>}
	 * @memberof ElmComponent
	 */
	// eslint-disable-next-line react/no-unused-class-component-methods -- We need it internally.
	public get model(): Immutable<TModel> {
		return this.currentModel;
	}

	/**
	 * Dispatches a message.
	 * @param {TMessage} msg The message to dispatch.
	 * @memberof ElmComponent
	 */
	public readonly dispatch = (msg: TMessage): void => {
		if (this.running) {
			this.buffer.push(msg);

			return;
		}

		this.running = true;

		let nextMsg: TMessage | undefined = msg;

		do {
			const currentMessage = nextMsg;

			logMessage(this.componentName, currentMessage);

			const [defer, getDeferred] = createDefer<TMessage>();
			const callBase = createCallBase(currentMessage, this.currentModel, this.props, { defer });

			const commands: UpdateReturnType<TMessage> = [];

			this.currentModel = produce(this.currentModel, (draft: Draft<TModel>) => {
				commands.push(...this.update(draft, currentMessage, this.props, { defer, callBase }));
			});

			const deferredCommands = getDeferred();

			execCmd(this.dispatch, ...commands, ...deferredCommands);

			nextMsg = this.buffer.shift();
		} while (nextMsg);

		this.running = false;

		if (this.mounted) {
			Services.logger?.debug("Update model for", this.componentName, this.currentModel);
			this.forceUpdate();
		}
	};

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
	public abstract update: UpdateFunction<TProps, TModel, TMessage>;
}

export { ElmComponent };
