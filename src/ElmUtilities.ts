import { UpdateReturnType } from "./ElmComponent";

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

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmishMap hook.
 */
export type UpdateMap<TProps, TModel, TMsg extends MessageBase> = {
    [M in TMsg as M["name"]]: (msg: M, model: TModel, props: TProps) => UpdateReturnType<TModel, TMsg>;
};