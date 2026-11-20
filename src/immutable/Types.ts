import type { Draft, Immutable } from "immer";
import type { Commands, Message, SubscriptionResult } from "../Types";

/**
 * Type for the return value of the `update` function.
 */
type UpdateReturnType<TMessage> = Commands<TMessage>;

type DeferFunction<TMessage> = (...commands: Commands<TMessage>) => void;
/**
 * Calls the handler of a base module with the current message, draft, props, and options.
 * The returned commands keep the message type of the base handler, so they can only be used
 * (e.g. passed to `defer`) if the base messages are part of the messages of the calling component.
 */
type CallBaseFunction<TModel, TProps, TMessage extends Message> = <TBaseMessage extends Message>(
	fn: BaseHandler<TModel, TProps, TMessage, TBaseMessage>,
) => UpdateReturnType<TBaseMessage>;

/**
 * A handler of a base module which can be called with `callBase`.
 */
type BaseHandler<TModel, TProps, TMessage extends Message, TBaseMessage extends Message> = (
	msg: TMessage,
	model: Draft<TModel>,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TBaseMessage, TMessage>,
) => UpdateReturnType<TBaseMessage>;

type UpdateMapFunction<TProps, TModel, TMessage extends Message> = (
	msg: TMessage,
	model: Draft<TModel>,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
) => UpdateReturnType<TMessage>;

interface UpdateFunctionOptions<TProps, TModel, TMessage extends Message, TSpecificMessage extends Message = TMessage> {
	defer: DeferFunction<TMessage>;
	callBase: CallBaseFunction<TModel, TProps, TSpecificMessage>;
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
		options: UpdateFunctionOptions<TProps, TModel, TMessage, TMessage & { name: TMessageName }>,
	) => UpdateReturnType<TMessage>;
};

type Subscription<TProps, TModel, TMessage extends Message> = (
	model: Immutable<TModel>,
	props: TProps,
) => SubscriptionResult<TMessage>;

export type {
	BaseHandler,
	CallBaseFunction,
	DeferFunction,
	Subscription,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
};
