/* eslint-disable react-hooks/exhaustive-deps */
import { Cmd, Dispatch } from "../Cmd";
import { InitFunction, MessageBase, Nullable, UpdateMap } from "../Types";
import { useCallback, useState } from "react";
import { callUpdateMap } from "../useElmish";
import { Services } from "../Init";

/**
 * Hook to use the Elm architecture pattern in a function component.
 * @param props The props of the component.
 * @param init Function to initialize the model.
 * @param updateMap The update map object.
 * @param name The name of the component.
 * @returns A tuple containing the current model and the dispatcher.
 * @example
 * const [model, dispatch] = useElmishMap(props, init, updateMap, "MyComponent");
 * @deprecated Use `useElmish` with an options object instead.
 */
export function useElmishMap<TProps, TModel, TMessage extends MessageBase> (props: TProps, init: InitFunction<TProps, TModel, TMessage>, updateMap: UpdateMap<TProps, TModel, TMessage>, name: string): [TModel, Dispatch<TMessage>] {
    let reentered = false;
    const buffer: TMessage [] = [];
    let currentModel: Partial<TModel> = {};

    const [model, setModel] = useState<Nullable<TModel>>(null);
    let initializedModel = model;

    const execCmd = useCallback((cmd: Cmd<TMessage>): void => {
        cmd.forEach(call => {
            try {
                call(dispatch);
            } catch (ex: unknown) {
                Services.logger?.error(ex);
            }
        });
    }, []);

    const dispatch = useCallback((msg: TMessage): void => {
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

            let nextMsg: TMessage | undefined = msg;
            let modified = false;

            while (nextMsg) {
                Services.logger?.info("Elm", "message from", name, nextMsg.name);
                Services.logger?.debug("Elm", "message from", name, nextMsg);

                try {
                    const [newModel, cmd] = callUpdateMap(updateMap, nextMsg, { ...initializedModel, ...currentModel }, props);

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