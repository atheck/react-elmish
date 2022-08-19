import { Cmd } from "../Cmd";
import { MessageBase, Nullable, UpdateMap, UpdateReturnType } from "../Types";
import { callUpdateMap } from "../useElmish";
import { RenderWithModelOptions, setFakeOptions } from "./fakeOptions";

/**
 * Extracts the messages out of a command.
 * @param cmd The command to process.
 * @returns The array of messages.
 */
function getOfMsgParams<TMessage> (cmd?: Cmd<TMessage>): TMessage [] {
    const msgNames: TMessage [] = [];

    const dispatch = (msg: TMessage): void => {
        msgNames.push(msg);
    };

    cmd?.map(currentCmd => currentCmd(dispatch));

    return msgNames;
}

/**
 * Executes all commands and resolves the messages.
 * @param cmd The command to process.
 * @returns The array of processed messages.
 */
async function execCmd<TMessage> (cmd?: Cmd<TMessage>): Promise<Nullable<TMessage> []> {
    if (!cmd) {
        return [];
    }

    const callers = cmd.map(async currentCmd => new Promise<Nullable<TMessage>>((resolve, reject) => {
        const dispatch = (msg: TMessage): void => resolve(msg);

        currentCmd(dispatch, error => {
            if (error) {
                reject(error);
            } else {
                resolve(null);
            }
        });
    }));

    const results = await Promise.all(callers);

    return results;
}

/**
 * Creates an update function out of an UpdateMap.
 * @param {UpdateMap<TProps, TModel, TMessage>} updateMap The UpdateMap.
 * @returns {(msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage>} The created update function which can be used in tests.
 */
function getUpdateFn<TProps, TModel, TMessage extends MessageBase> (updateMap: UpdateMap<TProps, TModel, TMessage>): (msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage> {
    return function (msg: TMessage, model: TModel, props: TProps): UpdateReturnType<TModel, TMessage> {
        return callUpdateMap(updateMap, msg, model, props);
    };
}

type UpdateArgsFactory<TProps, TModel, TMessage extends MessageBase> = (msg: TMessage, modelTemplate?: Partial<TModel>, propsTemplate?: Partial<TProps>) => [TMessage, TModel, TProps];

/**
 * Creates a factory function to create a message, a model, and props which can be passed to an update function in tests.
 * @param {() => TModel} initModel A function to create an initial model.
 * @param {() => TProps} initProps A function to create initial props.
 * @returns {UpdateArgsFactory<TProps, TModel, TMessage>} A function to create a message, a model, and props.
 * @example
 * // one time
 * const createUpdateArgs = createUpdateArgsFactory(() => ({ ... }), () => ({ ... }));
 * // in tests
 * const [msg, model, props] = createUpdateArgs(Msg.myMessage(), { ... }, , { ... });
 */
function createUpdateArgsFactory<TProps, TModel, TMessage extends MessageBase> (initModel: () => TModel, initProps: () => TProps): UpdateArgsFactory<TProps, TModel, TMessage> {
    return function (msg: TMessage, modelTemplate?: Partial<TModel>, propsTemplate?: Partial<TProps>): [TMessage, TModel, TProps] {
        return [
            msg,
            {
                ...initModel(),
                ...modelTemplate,
            },
            {
                ...initProps(),
                ...propsTemplate,
            },
        ];
    };
}

/**
 * Renders a component with a provided model.
 * @template TModel The type of the model.
 * @template TMessage The type of the message discriminated union.
 * @template TResult The return type of the render function.
 * @param {() => TResult} render A function to render the component. Use the `render` function of the used testing library.
 * @param {(TModel | RenderWithModelOptions<TModel, TMessage>)} options The model or an options object.
 * @returns {TResult} The returned value of the `render` function.
 */
function renderWithModel<TModel, TMessage extends MessageBase, TResult> (render: () => TResult, options: TModel | RenderWithModelOptions<TModel, TMessage>): TResult {
    if ("model" in options && "dispatch" in options) {
        setFakeOptions(options as RenderWithModelOptions<unknown, MessageBase>);
    } else {
        setFakeOptions({
            model: options,
        });
    }

    const result = render();

    setFakeOptions(null);

    return result;
}

export type {
    UpdateArgsFactory,
    RenderWithModelOptions,
};

export {
    getOfMsgParams,
    execCmd,
    getUpdateFn,
    createUpdateArgsFactory,
    renderWithModel,
};