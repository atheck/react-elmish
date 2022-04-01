import { Cmd, Dispatch } from "../Cmd";
import { dispatchMiddleware, LoggerService } from "../Init";
import { InitFunction, UpdateFunction } from "../ElmComponent";
import { MessageBase, Nullable } from "../ElmUtilities";
import { useCallback, useState } from "react";

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
                LoggerService?.error(ex);
            }
        });
    }, []);

    const dispatch = useCallback((msg: TMsg): void => {
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

            let nextMsg: TMsg | undefined = msg;
            let modified = false;

            while (nextMsg) {
                LoggerService?.info("Elm", "message from", name, nextMsg.name);
                LoggerService?.debug("Elm", "message from", name, nextMsg);

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

        if (initCmd) {
            execCmd(initCmd);
        }
    }

    return [initializedModel, dispatch];
}