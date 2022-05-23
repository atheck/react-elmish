/* eslint-disable react-hooks/exhaustive-deps */
import { Cmd, Dispatch } from "../Cmd";
import { InitFunction, MessageBase, Nullable, UpdateFunction } from "../Types";
import { useCallback, useState } from "react";
import { Services } from "../Init";

/**
 * Hook to use the Elm architecture pattern in a function component.
 * @param props The props of the component.
 * @param init Function to initialize the model.
 * @param update The update function.
 * @param name The name of the component.
 * @returns A tuple containing the current model and the dispatcher.
 * @example
 * const [model, dispatch] = useElmish(props, init, update, "MyComponent");
 * @deprecated Use `useElmish` with an options object instead.
 */
export function useElmish<TProps, TModel, TMsg extends MessageBase> (props: TProps, init: InitFunction<TProps, TModel, TMsg>, update: UpdateFunction<TProps, TModel, TMsg>, name: string): [TModel, Dispatch<TMsg>] {
    let reentered = false;
    const buffer: TMsg [] = [];
    let currentModel: Partial<TModel> = {};

    const [model, setModel] = useState<Nullable<TModel>>(null);
    let initializedModel = model;

    const execCmd = useCallback((cmd: Cmd<TMsg>): void => {
        cmd.forEach(call => {
            try {
                call(dispatch);
            } catch (ex: unknown) {
                Services.logger?.error(ex);
            }
        });
    }, []);

    const dispatch = useCallback((msg: TMsg): void => {
        if (!initializedModel) {
            return;
        }

        const modelHasChanged = (updatedModel: Partial<TModel>): boolean => updatedModel !== initializedModel && Object.getOwnPropertyNames(updatedModel).length > 0;

        if (Services.dispatchMiddleware) {
            Services.dispatchMiddleware(msg);
        }

        if (reentered) {
            buffer.push(msg);
        } else {
            reentered = true;

            let nextMsg: TMsg | undefined = msg;
            let modified = false;

            while (nextMsg) {
                Services.logger?.info("Elm", "message from", name, nextMsg.name);
                Services.logger?.debug("Elm", "message from", name, nextMsg);

                try {
                    const [newModel, cmd] = update({ ...initializedModel, ...currentModel }, nextMsg, props);

                    if (modelHasChanged(newModel)) {
                        currentModel = { ...currentModel, ...newModel };

                        modified = true;
                    }

                    if (cmd) {
                        execCmd(cmd);
                    }
                } catch (ex: unknown) {
                    Services.logger?.error(ex);
                }

                nextMsg = buffer.shift();
            }
            reentered = false;

            if (modified) {
                setModel(prevModel => {
                    const updatedModel = { ...prevModel as TModel, ...currentModel };

                    Services.logger?.debug("Elm", "update model for", name, updatedModel);

                    return updatedModel;
                });
            }
        }
    }, []);

    if (!initializedModel) {
        const [initModel, initCmd] = init(props);

        initializedModel = initModel;
        setModel(initializedModel);

        if (initCmd) {
            execCmd(initCmd);
        }
    }

    return [initializedModel, dispatch];
}