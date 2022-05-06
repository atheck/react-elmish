import { Cmd } from "./Cmd";

export type Nullable<T> = T | null;

export interface MessageBase {
    name: string | symbol,
}

/**
 * Creates a MsgSource type.
 */
export interface MsgSource<T extends string> {
    source: T,
}

export type InitResult<TModel, TMessage> = [TModel, Cmd<TMessage>?];

export type InitFunction<TProps, TModel, TMessage> = (props: TProps) => InitResult<TModel, TMessage>;

/**
 * Type for the return value of the update function.
 */
export type UpdateReturnType<TModel, TMsg> = [Partial<TModel>, Cmd<TMsg>?];

export type UpdateFunction<TProps, TModel, TMsg> = (model: TModel, msg: TMsg, props: TProps) => UpdateReturnType<TModel, TMsg>;

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmishMap hook.
 */
export type UpdateMap<TProps, TModel, TMsg extends MessageBase> = {
    [M in TMsg as M["name"]]: (msg: M, model: TModel, props: TProps) => UpdateReturnType<TModel, TMsg>;
};