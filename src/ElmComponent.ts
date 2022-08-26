import React from "react";
import { Cmd } from "./Cmd";
import { execCmd, logMessage, modelHasChanged } from "./Common";
import { Message, Services } from "./Init";
import { getFakeOptionsOnce } from "./Testing/fakeOptions";
import { InitFunction, Nullable, UpdateFunction } from "./Types";

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
    private initCmd: Nullable<Cmd<TMessage>> | undefined;
    private readonly componentName: string;
    private readonly buffer: TMessage [] = [];
    private reentered = false;
    private mounted = false;
    private currentModel: TModel;

    /**
     * Creates an instance of ElmComponent.
     * @param {TProps} props The props for the component.
     * @param {() => TModel} init The initializer function.
     * @param name The name of the component.
     * @memberof ElmComponent
     */
    public constructor (props: TProps, init: InitFunction<TProps, TModel, TMessage>, name: string) {
        super(props);

        const fakeOptions = getFakeOptionsOnce();

        if (fakeOptions?.dispatch) {
            this.dispatch = fakeOptions.dispatch;
        }

        const [model, cmd] = fakeOptions?.model ? [fakeOptions.model as TModel] : init(this.props);

        this.componentName = name;
        this.currentModel = model;
        this.initCmd = cmd;
    }

    /**
     * Is called when the component is loaded.
     * When implementing this method, the base implementation has to be called.
     * @memberof ElmComponent
     */
    public componentDidMount (): void {
        this.mounted = true;

        if (this.initCmd) {
            execCmd(this.initCmd, this.dispatch);
            this.initCmd = null;
        }
    }

    /**
     * Is called before unloading the component.
     * When implementing this method, the base implementation has to be called.
     * @memberof ElmComponent
     */
    public componentWillUnmount (): void {
        this.mounted = false;
    }

    /**
     * Returns the current model.
     * @readonly
     * @type {Readonly<TModel>}
     * @memberof ElmComponent
     */
    public get model (): Readonly<TModel> {
        return this.currentModel;
    }

    /**
     * Dispatches a message.
     * @param {TMessage} msg The message to dispatch.
     * @memberof ElmComponent
     */
    public readonly dispatch = (msg: TMessage): void => {
        if (this.reentered) {
            this.buffer.push(msg);
        } else {
            this.reentered = true;

            let nextMsg: TMessage | undefined = msg;
            let modified = false;

            while (nextMsg) {
                logMessage(this.componentName, nextMsg);

                const [model, cmd] = this.update(this.currentModel, nextMsg, this.props);

                if (modelHasChanged(this.currentModel, model)) {
                    this.currentModel = { ...this.currentModel, ...model };
                    modified = true;
                }

                if (cmd) {
                    execCmd(cmd, this.dispatch);
                }

                nextMsg = this.buffer.shift();
            }
            this.reentered = false;

            if (this.mounted && modified) {
                Services.logger?.debug("Elm", "update model for", this.componentName, this.currentModel);
                this.forceUpdate();
            }
        }
    };

    /**
     * Function to modify the model based on a message.
     * @param {TModel} model The current model.
     * @param {TMessage} msg The message to process.
     * @param {TProps} props The props of the component.
     * @returns The new model (can also be an empty object {}) and an optional new message to dispatch.
     * @abstract
     * @memberof ElmComponent
     */
    public abstract update: UpdateFunction<TProps, TModel, TMessage>;
}

export {
    ElmComponent,
};