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

type InitResult<TModel, TMessage> = [TModel, Cmd<TMessage>?];

type InitFunction<TProps, TModel, TMessage> = (props: TProps) => InitResult<TModel, TMessage>;

/**
 * Type for the return value of the update function.
 */
type UpdateReturnType<TModel, TMsg> = [Partial<TModel>, Cmd<TMsg>?];

type UpdateFunction<TProps, TModel, TMsg> = (model: TModel, msg: TMsg, props: TProps) => UpdateReturnType<TModel, TMsg>;

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmishMap hook.
 */
type UpdateMap<TProps, TModel, TMsg extends MessageBase> = {
    [M in TMsg as M["name"]]: (msg: M, model: TModel, props: TProps) => UpdateReturnType<TModel, TMsg>;
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