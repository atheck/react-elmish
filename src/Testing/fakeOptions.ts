import { Dispatch } from "../Cmd";
import { MessageBase, Nullable } from "../Types";

/**
 * Options for the `renderWithModel` function.
 * @interface RenderWithModelOptions
 * @template TModel The type of the model.
 * @template TMessage The type of the messages discriminated union.
 */
interface RenderWithModelOptions<TModel, TMessage extends MessageBase> {
    /**
     * The model to use when rendering the component.
     * @type {TModel}
     */
    model: TModel,

    /**
     * A fake dispatch function to use when processing messages.
     * @type {Dispatch<TMessage>}
     */
    dispatch?: Dispatch<TMessage>,
}

let currentFakeOptions: Nullable<RenderWithModelOptions<unknown, MessageBase>>;

function setFakeOptions (options: Nullable<RenderWithModelOptions<unknown, MessageBase>>): void {
    currentFakeOptions = options;
}

function getFakeOptionsOnce<TModel, TMessage extends MessageBase> (): Nullable<RenderWithModelOptions<TModel, TMessage>> {
    const temp = currentFakeOptions;

    currentFakeOptions = null;

    return temp as RenderWithModelOptions<TModel, TMessage>;
}

export type {
    RenderWithModelOptions,
};

export {
    setFakeOptions,
    getFakeOptionsOnce,
};