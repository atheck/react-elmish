import { Cmd, Dispatch } from "./Cmd";
import { dispatchMiddleware, LoggerService } from "./Init";
import { UpdateReturnType } from ".";
import { useState } from "react";

export function useElmish<TProps, TModel, TMsg extends { name: string | symbol }> (props: TProps, init: (props: TProps) => [TModel, Cmd<TMsg>], update: (model: TModel, msg: TMsg, props: TProps) => UpdateReturnType<TModel, TMsg>, name: string): [TModel, Dispatch<TMsg>] {
    let reentered = false;
    const buffer: TMsg [] = [];
    let currentModel: Partial<TModel> = {};

    const state = useState<Nullable<TModel>>(null);
    let model = state[0];
    const setModel = state[1];

    const execCmd = (cmd: Cmd<TMsg>): void => {
        cmd.forEach(call => {
            try {
                call(dispatch);
            } catch (ex: unknown) {
                LoggerService?.error(ex);
            }
        });
    };

    const dispatch = (msg: TMsg): void => {
        if (!model) {
            return;
        }

        const modelHasChanged = (updatedModel: Partial<TModel>): boolean => updatedModel !== model && Object.getOwnPropertyNames(updatedModel).length > 0;

        if (dispatchMiddleware) {
            dispatchMiddleware(msg);
        }

        if (reentered) {
            buffer.push(msg);
        } else {
            reentered = true;

            let nextMsg: TMsg | undefined = msg;
            let modified = false;

            while (nextMsg) {
                LoggerService?.info("Elm", "message from", name, nextMsg.name);
                LoggerService?.debug("Elm", "message from", name, nextMsg);

                try {
                    const [newModel, cmd] = update({ ...model, ...currentModel }, nextMsg, props);

                    if (modelHasChanged(newModel)) {
                        currentModel = { ...currentModel, ...newModel };

                        modified = true;
                    }

                    if (cmd) {
                        execCmd(cmd);
                    }
                } catch (ex: unknown) {
                    LoggerService?.error(ex);
                }

                nextMsg = buffer.shift();
            }
            reentered = false;

            if (modified) {
                setModel(prevModel => {
                    const updatedModel = { ...prevModel as TModel, ...currentModel };

                    LoggerService?.debug("Elm", "update model for", name, updatedModel);

                    return updatedModel;
                });
            }
        }
    };

    if (!model) {
        const [initModel, initCmd] = init(props);

        model = initModel;
        setModel(model);

        execCmd(initCmd);
    }

    return [model, dispatch];
}