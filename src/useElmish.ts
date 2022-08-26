/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from "react";
import { Cmd, Dispatch } from "./Cmd";
import { execCmd, logMessage, modelHasChanged } from "./Common";
import { Services } from "./Init";
import { getFakeOptionsOnce } from "./Testing/fakeOptions";
import { InitFunction, MessageBase, Nullable, UpdateFunction, UpdateMap, UpdateReturnType } from "./Types";

/**
 * The return type of the `subscription` function.
 * @template TMessage The type of the messages discriminated union.
 */
type SubscriptionResult<TMessage> = [Cmd<TMessage>, (() => void)?];
type Subscription<TProps, TModel, TMessage> = (model: TModel, props: TProps) => SubscriptionResult<TMessage>;

/**
 * Options for the `useElmish` hook.
 * @interface UseElmishOptions
 * @template TProps The type of the props.
 * @template TModel The type of the model.
 * @template TMessage The type of the messages discriminated union.
 */
interface UseElmishOptions<TProps, TModel, TMessage extends MessageBase> {
    /**
     * The name of the component. This is used for logging only.
     * @type {string}
     */
    name: string,
    /**
     * The props passed to the component.
     * @type {TProps}
     */
    props: TProps,
    /**
     * The function to initialize the components model. This function is only called once.
     * @type {InitFunction<TProps, TModel, TMessage>}
     */
    init: InitFunction<TProps, TModel, TMessage>,
    /**
     * The `update` function or update map object.
     * @type {(UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>)}
     */
    update: UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>,
    /**
     * The optional `subscription` function. This function is only called once.
     * @type {(UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>)}
     */
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

    const fakeOptions = getFakeOptionsOnce();
    const dispatch = useCallback(fakeOptions?.dispatch ?? ((msg: TMessage): void => {
        if (!initializedModel) {
            return;
        }

        if (reentered) {
            buffer.push(msg);
        } else {
            reentered = true;

            let nextMsg: TMessage | undefined = msg;
            let modified = false;

            while (nextMsg) {
                logMessage(name, nextMsg);

                try {
                    const [newModel, cmd] = callUpdate(update, nextMsg, { ...initializedModel, ...currentModel }, propsRef.current);

                    if (modelHasChanged(currentModel, newModel)) {
                        currentModel = { ...currentModel, ...newModel };

                        modified = true;
                    }

                    if (cmd) {
                        execCmd(cmd, dispatch);
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
    }), []);

    if (!initializedModel) {
        const [initModel, initCmd] = fakeOptions?.model ? [fakeOptions.model as TModel] : init(props);

        initializedModel = initModel;
        setModel(initializedModel);

        if (initCmd) {
            execCmd(initCmd, dispatch);
        }
    }

    useEffect(() => {
        if (subscription) {
            const [subCmd, destructor] = subscription(initializedModel as TModel, props);

            execCmd(subCmd, dispatch);

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