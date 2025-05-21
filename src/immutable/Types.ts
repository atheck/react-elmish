import type { Draft, Immutable } from "immer";
import type { Cmd, Message, SubscriptionResult } from "../Types";

/**
 * Type for the return value of the `update` function.
 */
type UpdateReturnType<TMessage> = (Cmd<TMessage> | undefined)[];

type DeferFunction<TMessage> = (...commands: (Cmd<TMessage> | undefined)[]) => void;
type CallBaseFunction<TModel, TProps, TMessage> = (
	fn: (
		msg: TMessage,
		model: Draft<TModel>,
		props: TProps,
		options: UpdateFunctionOptions<TProps, TModel, TMessage>,
	) => UpdateReturnType<Message>,
) => [Immutable<TModel>, UpdateReturnType<TMessage>];

type UpdateMapFunction<TProps, TModel, TMessage> = (
	msg: TMessage,
	model: Draft<TModel>,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
) => UpdateReturnType<TMessage>;

interface UpdateFunctionOptions<TProps, TModel, TMessage> {
	defer: DeferFunction<TMessage>;
	callBase: CallBaseFunction<TModel, TProps, TMessage>;
}

type UpdateFunction<TProps, TModel, TMessage extends Message> = (
	model: Draft<TModel>,
	msg: TMessage,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
) => UpdateReturnType<TMessage>;

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmish hook.
 */
type UpdateMap<TProps, TModel, TMessage extends Message> = {
	[TMessageName in TMessage["name"]]: (
		msg: TMessage & { name: TMessageName },
		model: Draft<TModel>,
		props: TProps,
		options: UpdateFunctionOptions<TProps, TModel, TMessage>,
	) => UpdateReturnType<TMessage>;
};

type Subscription<TProps, TModel, TMessage> = (model: Immutable<TModel>, props: TProps) => SubscriptionResult<TMessage>;

export type {
	CallBaseFunction,
	DeferFunction,
	Subscription,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
};
