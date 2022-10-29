import { Message } from "../Types";

type UpdateArgsFactory<TProps, TModel, TMessage extends Message> = (msg: TMessage, modelTemplate?: Partial<TModel>, propsTemplate?: Partial<TProps>) => [TMessage, TModel, TProps];

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
function createUpdateArgsFactory<TProps, TModel, TMessage extends Message> (initModel: () => TModel, initProps: () => TProps): UpdateArgsFactory<TProps, TModel, TMessage> {
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

export type {
    UpdateArgsFactory,
};

export {
    createUpdateArgsFactory,
};