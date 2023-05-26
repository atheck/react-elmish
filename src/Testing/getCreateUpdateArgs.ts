import { InitFunction, Message } from "../Types";
import { UpdateArgsFactory } from "./createUpdateArgsFactory";

/**
 * Creates a factory function to create a message, a model, and props which can be passed to an update function in tests.
 * @param {InitFunction<TProps, TModel, TMessage>} init The init function which creates the model.
 * @param {() => TProps} initProps A function to create initial props.
 * @returns {UpdateArgsFactory<TProps, TModel, TMessage>} A function to create a message, a model, and props.
 * @example
 * // one time
 * const createUpdateArgs = getCreateUpdateArgs(init, () => ({ ... }));
 * // in tests
 * const [msg, model, props] = createUpdateArgs(Msg.myMessage(), { ... }, , { ... });
 */
function getCreateUpdateArgs<TProps, TModel, TMessage extends Message> (init: InitFunction<TProps, TModel, TMessage>, initProps: () => TProps): UpdateArgsFactory<TProps, TModel, TMessage> {
    return function (msg: TMessage, modelTemplate?: Partial<TModel>, propsTemplate?: Partial<TProps>): [TMessage, TModel, TProps] {
        const props = {
            ...initProps(),
            ...propsTemplate,
        };
        const [model] = init(props);

        return [
            msg,
            {
                ...model,
                ...modelTemplate,
            },
            props,
        ];
    };
}

export {
    getCreateUpdateArgs,
};