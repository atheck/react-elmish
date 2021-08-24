import { useState } from "react";
import { UpdateReturnType } from ".";
import { Cmd, Dispatch } from "./Cmd";
import { DispatchMiddleware, LoggerService } from "./Init";

export const useElmish = <TProps, TModel, TMsg extends { name: string | symbol }>(props: TProps, init: (props: TProps) => [TModel, Cmd<TMsg>], update: (model: TModel, msg: TMsg, props: TProps) => UpdateReturnType<TModel, TMsg>, name: string): [TModel, Dispatch<TMsg>] => {
    let reentered = false;
    let buffer: TMsg [] = [];

    const dispatch = (msg: TMsg): void => {
        if (!model) {
            return;
        }

        const modelHasChanged = (updatedModel: Partial<TModel>): boolean => {
            return updatedModel !== model && Object.getOwnPropertyNames(updatedModel).length > 0;
        };

        if (DispatchMiddleware) {
            DispatchMiddleware(msg);
        }

        if (reentered) {
            buffer.push(msg);
        } else {
            reentered = true;

            let nextMsg: TMsg | undefined = msg;
            let currentModel: Partial<TModel> = {};
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
                } catch (error) {
                    LoggerService?.error(error);
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

    const execCmd = (cmd: Cmd<TMsg>) => {
        cmd.forEach(call => {
            try {
                call(dispatch);
            } catch (error) {
                LoggerService?.error(error);
            }
        });
    };

    const state = useState<Nullable<TModel>>(null);
    let model = state[0];
    const setModel = state[1];

    if (!model) {
        const [initModel, initCmd] = init(props);

        model = initModel;
        setModel(model);

        if (initCmd) {
            execCmd(initCmd);
        }
    }

    return [model, dispatch];
};