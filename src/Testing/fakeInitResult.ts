import { MessageBase, Nullable } from "../Types";
import { Dispatch } from "../Cmd";

interface RenderWithModelOptions<TModel, TMessage extends MessageBase> {
    model: TModel,
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