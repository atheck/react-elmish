import type { Immutable } from "immer";
import type { Cmd, Message, SubscriptionResult } from "../Types";

type DraftModelFunction<TModel> = (draft: TModel) => void;

/**
 * Type for the return value of the `update` function.
 */
type UpdateReturnType<TModel, TMessage> = [DraftModelFunction<TModel> | null | undefined, ...(Cmd<TMessage> | undefined)[]] | [];

type DeferFunction<TModel, TMessage> = (
	draftFn: DraftModelFunction<TModel> | null | undefined,
	...commands: (Cmd<TMessage> | undefined)[]
) => void;
type CallBaseFunction<TModel, TProps, TMessage> = (
	fn: (
		msg: TMessage,
		model: Immutable<TModel>,
		props: TProps,
		options: UpdateFunctionOptions<TProps, TModel, TMessage>,
	) => UpdateReturnType<TModel, Message>,
) => UpdateReturnType<TModel, TMessage>;

type UpdateMapFunction<TProps, TModel, TMessage> = (
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
) => UpdateReturnType<TModel, TMessage>;

interface UpdateFunctionOptions<TProps, TModel, TMessage> {
	defer: DeferFunction<TModel, TMessage>;
	callBase: CallBaseFunction<TModel, TProps, TMessage>;
}

type UpdateFunction<TProps, TModel, TMessage extends Message> = (
	model: Immutable<TModel>,
	msg: TMessage,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
) => UpdateReturnType<TModel, TMessage>;

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmish hook.
 */
type UpdateMap<TProps, TModel, TMessage extends Message> = {
	[TMessageName in TMessage["name"]]: (
		msg: TMessage & { name: TMessageName },
		model: Immutable<TModel>,
		props: TProps,
		options: UpdateFunctionOptions<TProps, TModel, TMessage & { name: TMessageName }>,
	) => UpdateReturnType<TModel, TMessage>;
};

type Subscription<TProps, TModel, TMessage> = (model: Immutable<TModel>, props: TProps) => SubscriptionResult<TMessage>;

export type {
	CallBaseFunction,
	DeferFunction,
	DraftModelFunction,
	Subscription,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
};
