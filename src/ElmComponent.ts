import React from "react";
import { execCmd, logMessage, modelHasChanged } from "./Common";
import { Services } from "./Init";
import type { Cmd, InitFunction, Message, Nullable, UpdateFunction } from "./Types";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import { getFakeOptionsOnce } from "./fakeOptions";

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
abstract class ElmComponent<TModel, TMessage extends Message, TProps> extends React.Component<TProps> {
	private initCommands: Nullable<(Cmd<TMessage> | undefined)[]> | undefined;
	private readonly componentName: string;
	private readonly buffer: TMessage[] = [];
	private running = false;
	private mounted = false;
	private currentModel: TModel;

	/**
	 * Creates an instance of ElmComponent.
	 * @param {TProps} props The props for the component.
	 * @param {() => TModel} init The initializer function.
	 * @param name The name of the component.
	 * @memberof ElmComponent
	 */
	public constructor(props: TProps, init: InitFunction<TProps, TModel, TMessage>, name: string) {
		super(props);

		const fakeOptions = getFakeOptionsOnce();

		if (fakeOptions?.dispatch) {
			this.dispatch = fakeOptions.dispatch;
		}

		const [model, ...commands] = fakeOptions?.model ? [fakeOptions.model as TModel] : init(this.props);

		Services.logger?.debug("Initial model for", name, model);

		this.componentName = name;
		this.currentModel = model;
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
		this.mounted = false;
	}

	/**
	 * Returns the current model.
	 * @readonly
	 * @type {Readonly<TModel>}
	 * @memberof ElmComponent
	 */
	// eslint-disable-next-line react/no-unused-class-component-methods -- We need it internally.
	public get model(): Readonly<TModel> {
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
		let modified = false;

		do {
			const currentMessage = nextMsg;

			logMessage(this.componentName, currentMessage);

			const [defer, getDeferred] = createDefer<TModel, TMessage>();
			const callBase = createCallBase(currentMessage, this.currentModel, this.props, { defer });

			const [model, ...commands] = this.update(this.currentModel, currentMessage, this.props, { defer, callBase });

			const [deferredModel, deferredCommands] = getDeferred();

			if (modelHasChanged(this.currentModel, { ...deferredModel, ...model })) {
				this.currentModel = { ...this.currentModel, ...deferredModel, ...model };
				modified = true;
			}

			execCmd(this.dispatch, ...commands, ...deferredCommands);

			nextMsg = this.buffer.shift();
		} while (nextMsg);

		this.running = false;

		if (this.mounted && modified) {
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
