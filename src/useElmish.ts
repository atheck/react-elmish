/* eslint-disable react-hooks/exhaustive-deps */
import { Cmd, Dispatch } from "./Cmd";
import { InitFunction, MessageBase, Nullable, UpdateFunction, UpdateMap, UpdateReturnType } from "./Types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Services } from "./Init";

type SubscriptionResult<TMessage> = [Cmd<TMessage>, (() => void)?];
type Subscription<TProps, TModel, TMessage> = (model: TModel, props: TProps) => SubscriptionResult<TMessage>;

interface UseElmishOptions<TProps, TModel, TMessage extends MessageBase> {
    name: string,
    props: TProps,
    init: InitFunction<TProps, TModel, TMessage>,
    update: UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>,
    subscription?: Subscription<TProps, TModel, TMessage>,
}

/**
 * Hook to use the Elm architecture pattern in a function component.
 * @param {UseElmishOptions} options The options passed the the hook.
 * @returns A tuple containing the current model and the dispatcher.
 * @example
 * const [model, dispatch] = useElmish({ props, init, update, name: "MyComponent" });
 */
function useElmish<TProps, TModel, TMessage extends MessageBase> ({ name, props, init, update, subscription }: UseElmishOptions<TProps, TModel, TMessage>): [TModel, Dispatch<TMessage>] {
    let reentered = false;
    const buffer: TMessage [] = [];
    let currentModel: Partial<TModel> = {};

    const [model, setModel] = useState<Nullable<TModel>>(null);
    let initializedModel = model;

    const propsRef = useRef(props);

    if (propsRef.current !== props) {
        propsRef.current = props;
    }

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

        if (reentered) {
            buffer.push(msg);
        } else {
            reentered = true;

            let nextMsg: TMessage | undefined = msg;
            let modified = false;

            while (nextMsg) {
                Services.logger?.info("Elm", "message from", name, nextMsg.name);
                Services.logger?.debug("Elm", "message from", name, nextMsg);

                if (Services.dispatchMiddleware) {
                    Services.dispatchMiddleware(nextMsg);
                }

                try {
                    const [newModel, cmd] = callUpdate(update, nextMsg, { ...initializedModel, ...currentModel }, propsRef.current);

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

    useEffect(() => {
        if (subscription) {
            const [subCmd, destructor] = subscription(initializedModel as TModel, props);

            execCmd(subCmd);

            if (destructor) {
                return destructor;
            }
        }
    }, []);

    return [initializedModel, dispatch];
}

function callUpdate<TProps, TModel, TMessage extends MessageBase> (update: UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>, msg: TMessage, model: TModel, props: TProps): UpdateReturnType<TModel, TMessage> {
    if (typeof update === "function") {
        return update(model, msg, props);
    }

    return callUpdateMap(update, msg, model, props);
}

function callUpdateMap<TProps, TModel, TMessage extends MessageBase> (updateMap: UpdateMap<TProps, TModel, TMessage>, msg: TMessage, model: TModel, props: TProps): UpdateReturnType<TModel, TMessage> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error -- We know that msg fits
    const updateFn = updateMap[msg.name as TMessage["name"]] as (msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMsg>;

    return updateFn(msg, model, props);
}

export type {
    SubscriptionResult,
};

export {
    useElmish,
    callUpdate,
    callUpdateMap,
};