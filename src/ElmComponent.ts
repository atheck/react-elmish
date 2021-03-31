import { Cmd } from "./Cmd";
import { LoggerService } from "./Init";
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
export abstract class ElmComponent<TModel, TMsg extends { name: string | symbol }, TProps> extends React.Component<TProps> {
    private readonly _name: string;
    private _initCmd: Nullable<Cmd<TMsg>> | undefined;
    private readonly _buffer: TMsg [] = [];
    private _reentered = false;
    private _mounted = false;
    private _currentModel: TModel;

    /**
     * Creates an instance of ElmComponent.
     * @param {TProps} props The props for the component.
     * @param {() => TModel} init The initializer function.
     * @param name The name of the component.
     * @memberof ElmComponent
     */
    constructor(props: TProps, init: (arg: TProps) => [TModel, Cmd<TMsg> | undefined], name: string) {
        super(props);

        const [model, cmd] = init(this.props);

        this._name = name;
        this._currentModel = model;
        this._initCmd = cmd;
    }

    /**
     * Returns the current model.
     * @readonly
     * @type {Readonly<TModel>}
     * @memberof ElmComponent
     */
    get model(): Readonly<TModel> {
        return this._currentModel;
    }

    /**
     * Is called when the component is loaded.
     * When implementing this method, the base implementation has to be called.
     * @memberof ElmComponent
     */
    componentDidMount(): void {
        this._mounted = true;

        if (this._initCmd) {
            this.execCmd(this._initCmd);
            this._initCmd = null;
        }
    }

    /**
     * Is called before unloading the component.
     * When implementing this method, the base implementation has to be called.
     * @memberof ElmComponent
     */
    componentWillUnmount(): void {
        this._mounted = false;
    }

    private execCmd(cmd: Cmd<TMsg>) {
        cmd.forEach(call => {
            try {
                call(this.dispatch);
            } catch (error) {
                LoggerService?.error(error);
            }
        });
    }

    /**
     * Dispatches a message.
     * @param {TMsg} msg The message to dispatch.
     * @memberof ElmComponent
     */
    dispatch = (msg: TMsg): void => {
        const modelHasChanged = (model: Partial<TModel>): boolean => {
            return model !== this._currentModel && Object.getOwnPropertyNames(model).length > 0;
        };

        if (this._reentered) {
            this._buffer.push(msg);
        } else {
            this._reentered = true;

            let nextMsg: TMsg | undefined = msg;
            let modified = false;

            while (nextMsg) {
                LoggerService?.info("Elm", "message from", this._name, nextMsg.name);
                LoggerService?.debug("Elm", "message from", this._name, nextMsg);

                try {
                    const [model, cmd] = this.update(this._currentModel, nextMsg, this.props);

                    if (modelHasChanged(model)) {
                        this._currentModel = { ...this._currentModel, ...model };
                        modified = true;
                    }

                    if (cmd) {
                        this.execCmd(cmd);
                    }
                } catch (error) {
                    LoggerService?.error(error);
                }

                nextMsg = this._buffer.shift();
            }
            this._reentered = false;

            if (this._mounted && modified) {
                LoggerService?.debug("Elm", "update model for", this._name, this._currentModel);
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
    abstract update: (model: TModel, msg: TMsg, props: TProps) => UpdateReturnType<TModel, TMsg>;
}

/**
 * Type for the return value of the update function.
 */
export type UpdateReturnType<TModel, TMsg> = [Partial<TModel>, Cmd<TMsg>?];