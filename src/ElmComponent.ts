import { dispatchMiddleware, LoggerService, Message } from "./Init";
import { Cmd } from "./Cmd";
import { Nullable } from "./ElmUtilities";
import React from "react";

/**
 * Abstract class for a react class component using the elmish pattern.
 * @export
 * @abstract
 * @class ElmComponent
 * @extends {Component<TProps, TModel>}
 * @template TModel The type of the model.
 * @template TMsg The type of the messages.
 * @template TProps The type of the props.
 */
export abstract class ElmComponent<TModel, TMsg extends Message, TProps> extends React.Component<TProps> {
    private initCmd: Nullable<Cmd<TMsg>> | undefined;
    private readonly componentName: string;
    private readonly buffer: TMsg [] = [];
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
    public constructor (props: TProps, init: (arg: TProps) => [TModel, Cmd<TMsg> | undefined], name: string) {
        super(props);

        const [model, cmd] = init(this.props);

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
            this.execCmd(this.initCmd);
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

    private execCmd (cmd: Cmd<TMsg>): void {
        cmd.forEach(call => {
            try {
                call(this.dispatch);
            } catch (ex: unknown) {
                LoggerService?.error(ex);
            }
        });
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
     * @param {TMsg} msg The message to dispatch.
     * @memberof ElmComponent
     */
    public readonly dispatch = (msg: TMsg): void => {
        const modelHasChanged = (model: Partial<TModel>): boolean => model !== this.currentModel && Object.getOwnPropertyNames(model).length > 0;

        if (dispatchMiddleware) {
            dispatchMiddleware(msg);
        }

        if (this.reentered) {
            this.buffer.push(msg);
        } else {
            this.reentered = true;

            let nextMsg: TMsg | undefined = msg;
            let modified = false;

            while (nextMsg) {
                LoggerService?.info("Elm", "message from", this.componentName, nextMsg.name);
                LoggerService?.debug("Elm", "message from", this.componentName, nextMsg);

                try {
                    const [model, cmd] = this.update(this.currentModel, nextMsg, this.props);

                    if (modelHasChanged(model)) {
                        this.currentModel = { ...this.currentModel, ...model };
                        modified = true;
                    }

                    if (cmd) {
                        this.execCmd(cmd);
                    }
                } catch (ex: unknown) {
                    LoggerService?.error(ex);
                }

                nextMsg = this.buffer.shift();
            }
            this.reentered = false;

            if (this.mounted && modified) {
                LoggerService?.debug("Elm", "update model for", this.componentName, this.currentModel);
                this.forceUpdate();
            }
        }
    };

    /**
     * Function to modify the model based on a message.
     * @param {TModel} model The current model.
     * @param {TMsg} msg The message to process.
     * @param {TProps} props The props of the component.
     * @returns The new model (can also be an empty object {}) and an optional new message to dispatch.
     * @abstract
     * @memberof ElmComponent
     */
    public abstract update: (model: TModel, msg: TMsg, props: TProps) => UpdateReturnType<TModel, TMsg>;
}

/**
 * Type for the return value of the update function.
 */
export type UpdateReturnType<TModel, TMsg> = [Partial<TModel>, Cmd<TMsg>?];