import { Cmd } from "./Cmd";

type Nullable<T> = T | null;

interface MessageBase {
    name: string | symbol,
}

/**
 * Creates a MsgSource type.
 */
interface MsgSource<T extends string> {
    source: T,
}

/**
 * The return type of the `init` function.
 */
type InitResult<TModel, TMessage> = [TModel, Cmd<TMessage>?];

type InitFunction<TProps, TModel, TMessage> = (props: TProps) => InitResult<TModel, TMessage>;

/**
 * Type for the return value of the `update` function.
 */
type UpdateReturnType<TModel, TMessage> = [Partial<TModel>, Cmd<TMessage>?];

type UpdateFunction<TProps, TModel, TMessage> = (model: TModel, msg: TMessage, props: TProps) => UpdateReturnType<TModel, TMessage>;

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmish hook.
 */
type UpdateMap<TProps, TModel, TMessage extends MessageBase> = {
    [M in TMessage as M["name"]]: (msg: M, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage>;
};

export type {
    Nullable,
    MessageBase,
    MsgSource,
    InitResult,
    InitFunction,
    UpdateReturnType,
    UpdateFunction,
    UpdateMap,
};