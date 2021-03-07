import { Cmd } from "./Cmd";
import { LoggerService } from "./Init";
import React from "react";

/**
 * Abstrakte Klasse für React Class Components für die Verwendung von ELM.
 * @export
 * @abstract
 * @class ElmComponent
 * @extends {Component<TProps, TModel>}
 * @template TModel Der Typ des Models.
 * @template TMsg Der Typ der Msg Union.
 * @template TProps Der Typ der Props.
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
     * @param {TProps} props Die Props der Komponente.
     * @param {() => TModel} init Die Funktion zum Initialisieren des State.
     * @param name Der Name der Komponente.
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
     * Gibt das aktuelle Model zurück.
     * @readonly
     * @type {Readonly<TModel>}
     * @memberof ElmComponent
     */
    get model(): Readonly<TModel> {
        return this._currentModel;
    }

    /**
     * Wird aufgerufen nachdem die Komponente geladen wurde.
     * Bei der Implementierung der Methode in Ableitungen, muss die Methode der Basisklasse aufgerufen werden.
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
     * Wird aufgerufen bevor die Komponente entfernt wird.
     * Bei der Implementierung der Methode in Ableitungen, muss die Methode der Basisklasse aufgerufen werden.
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
     * Löst eine Msg aus.
     * @param {TMsg} msg Die auszulösende Msg.
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

                        LoggerService?.debug("Elm", "new temp model for", this._name, this._currentModel);
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
                LoggerService?.info("Elm", "update model for", this._name);
                this.forceUpdate();
            }
        }
    };

    /**
     * Aktualisiert den State anhand einer Msg.
     * Gibt den neuen State und eine folgende Msg zurück.
     * Der State ist partiell. Wenn sich der State nicht geändert hat, kann das übergebene Model
     * oder ein leeres Objekt {} zurückgegeben werden.
     * @param {TModel} model Der aktuelle State.
     * @param {TMsg} msg Die zu bearbeitende Msg.
     * @param {TProps} props Die Props der Component.
     * @returns Tuple aus neuem partiellem State und neuer auszulösenden Msg.
     * @abstract
     * @memberof ElmComponent
     */
    abstract update: (model: TModel, msg: TMsg, props: TProps) => UpdateReturnType<TModel, TMsg>;
}

/**
 * Hilfstyp für den Rückgabewert von ElmComponent.update.
 */
export type UpdateReturnType<TModel, TMsg> = [Partial<TModel>, Cmd<TMsg>?];