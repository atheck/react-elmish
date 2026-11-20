import type { Immutable } from "immer";
import type { Commands, Message, SubscriptionResult } from "../Types";
import type * as Variant from "../UpdateTypes";

/**
 * Type for the return value of the `update` function.
 */
type UpdateReturnType<TMessage> = Commands<TMessage>;

type DeferFunction<TMessage> = Variant.DeferFunction<"immutable", unknown, TMessage>;

type CallBaseFunction<TModel, TProps, TMessage extends Message> = Variant.CallBaseFunction<"immutable", TModel, TProps, TMessage>;

type BaseHandler<TModel, TProps, TMessage extends Message, TBaseMessage extends Message> = Variant.BaseHandler<
	"immutable",
	TModel,
	TProps,
	TMessage,
	TBaseMessage
>;

type UpdateMapFunction<TProps, TModel, TMessage extends Message> = Variant.UpdateMapFunction<
	"immutable",
	TProps,
	TModel,
	TMessage
>;

type UpdateFunctionOptions<
	TProps,
	TModel,
	TMessage extends Message,
	TCurrentMessage extends Message = TMessage,
> = Variant.UpdateFunctionOptions<"immutable", TProps, TModel, TMessage, TCurrentMessage>;

type UpdateFunction<TProps, TModel, TMessage extends Message> = Variant.UpdateFunction<"immutable", TProps, TModel, TMessage>;

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmish hook.
 */
type UpdateMap<TProps, TModel, TMessage extends Message> = Variant.UpdateMap<"immutable", TProps, TModel, TMessage>;

/**
 * An UpdateMap or an update function.
 * It is a union of the aliases above (and not of the generic variant types), so TypeScript can infer
 * the type arguments from an `UpdateMap` or `UpdateFunction` passed to a generic function.
 */
type Update<TProps, TModel, TMessage extends Message> =
	| UpdateFunction<TProps, TModel, TMessage>
	| UpdateMap<TProps, TModel, TMessage>;

type Subscription<TProps, TModel, TMessage extends Message> = (
	model: Immutable<TModel>,
	props: TProps,
) => SubscriptionResult<TMessage>;

export type {
	BaseHandler,
	CallBaseFunction,
	DeferFunction,
	Subscription,
	Update,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
};
