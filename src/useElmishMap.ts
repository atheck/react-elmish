import { Cmd, Dispatch } from "./Cmd";
import { dispatchMiddleware, LoggerService } from "./Init";
import { MessageBase, Nullable, UpdateMap } from "./ElmUtilities";
import { useCallback, useState } from "react";
import { UpdateReturnType } from "./ElmComponent";

export function useElmishMap<TProps, TModel, TMsg extends MessageBase> (props: TProps, init: (props: TProps) => [TModel, Cmd<TMsg>], updateMap: UpdateMap<TProps, TModel, TMsg>, name: string): [TModel, Dispatch<TMsg>] {
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

export function callUpdateMap<TProps, TModel, TMessage extends MessageBase> (updateMap: UpdateMap<TProps, TModel, TMessage>, msg: TMessage, model: TModel, props: TProps): UpdateReturnType<TModel, TMessage> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error -- We know that nextMsg fits
    return updateMap[msg.name as TMessage["name"]](msg, model, props);
}