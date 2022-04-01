import { Cmd, Dispatch } from "../Cmd";
import { dispatchMiddleware, LoggerService } from "../Init";
import { MessageBase, Nullable, UpdateMap } from "../ElmUtilities";
import { useCallback, useState } from "react";
import { callUpdateMap } from "../useElmish";

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
export function useElmishMap<TProps, TModel, TMessage extends MessageBase> (props: TProps, init: (props: TProps) => [TModel, Cmd<TMessage>], updateMap: UpdateMap<TProps, TModel, TMessage>, name: string): [TModel, Dispatch<TMessage>] {
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
                LoggerService?.error(ex);
            }
        });
    }, []);

    const dispatch = useCallback((msg: TMessage): void => {
        if (!initializedModel) {
            return;
        }

        const modelHasChanged = (updatedModel: Partial<TModel>): boolean => updatedModel !== initializedModel && Object.getOwnPropertyNames(updatedModel).length > 0;

        if (dispatchMiddleware) {
            dispatchMiddleware(msg);
        }

        if (reentered) {
            buffer.push(msg);
        } else {
            reentered = true;

            let nextMsg: TMessage | undefined = msg;
            let modified = false;

            while (nextMsg) {
                LoggerService?.info("Elm", "message from", name, nextMsg.name);
                LoggerService?.debug("Elm", "message from", name, nextMsg);

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
    }, []);

    if (!initializedModel) {
        const [initModel, initCmd] = init(props);

        initializedModel = initModel;
        setModel(initializedModel);

        execCmd(initCmd);
    }

    return [initializedModel, dispatch];
}