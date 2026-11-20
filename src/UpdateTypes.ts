import type { Draft } from "immer";
import type { Commands, Message } from "./Types";

/**
 * The variants differ in how the update handlers get the model and what they return:
 * - `mutable`: The handlers get the model and return the model changes and the commands.
 * - `immutable`: The handlers get an Immer draft of the model, modify it, and return the commands.
 */
type Variant = "mutable" | "immutable";

/**
 * The model passed to the update handlers.
 */
type HandlerModel<TVariant extends Variant, TModel> = TVariant extends "immutable" ? Draft<TModel> : TModel;

/**
 * The return type of the update handlers. `defer` takes the same arguments.
 */
type UpdateReturnType<TVariant extends Variant, TModel, TMessage> = TVariant extends "immutable"
	? Commands<TMessage>
	: [Partial<TModel>, ...Commands<TMessage>];

type DeferFunction<TVariant extends Variant, TModel, TMessage> = (...args: UpdateReturnType<TVariant, TModel, TMessage>) => void;

/**
 * Calls the handler of a base module with the current message, model, props, and options.
 * The returned commands keep the message type of the base handler, so they can only be used
 * (e.g. passed to `defer`) if the base messages are part of the messages of the calling component.
 * @template TMessage The message which is currently processed. It is passed to the base handler.
 */
type CallBaseFunction<TVariant extends Variant, TModel, TProps, TMessage extends Message> = <TBaseMessage extends Message>(
	fn: BaseHandler<TVariant, TModel, TProps, TMessage, TBaseMessage>,
) => UpdateReturnType<TVariant, TModel, TBaseMessage>;

/**
 * A handler of a base module which can be called with `callBase`.
 * @template TMessage The message which is currently processed.
 * @template TBaseMessage The messages of the base module, used by `defer` and the returned commands.
 */
type BaseHandler<TVariant extends Variant, TModel, TProps, TMessage extends Message, TBaseMessage extends Message> = (
	msg: TMessage,
	model: HandlerModel<TVariant, TModel>,
	props: TProps,
	options: UpdateFunctionOptions<TVariant, TProps, TModel, TBaseMessage, TMessage>,
) => UpdateReturnType<TVariant, TModel, TBaseMessage>;

/**
 * The options passed to an update handler.
 * @template TMessage The messages which can be deferred.
 * @template TCurrentMessage The message which is currently processed. `callBase` passes it to the base handler.
 */
interface UpdateFunctionOptions<
	TVariant extends Variant,
	TProps,
	TModel,
	TMessage extends Message,
	TCurrentMessage extends Message = TMessage,
> {
	defer: DeferFunction<TVariant, TModel, TMessage>;
	callBase: CallBaseFunction<TVariant, TModel, TProps, TCurrentMessage>;
}

/**
 * A single handler of an UpdateMap.
 */
type UpdateMapFunction<TVariant extends Variant, TProps, TModel, TMessage extends Message> = BaseHandler<
	TVariant,
	TModel,
	TProps,
	TMessage,
	TMessage
>;

type UpdateFunction<TVariant extends Variant, TProps, TModel, TMessage extends Message> = (
	model: HandlerModel<TVariant, TModel>,
	msg: TMessage,
	props: TProps,
	options: UpdateFunctionOptions<TVariant, TProps, TModel, TMessage>,
) => UpdateReturnType<TVariant, TModel, TMessage>;

/**
 * Maps the names of the messages to their handlers.
 */
type UpdateMap<TVariant extends Variant, TProps, TModel, TMessage extends Message> = {
	[TMessageName in TMessage["name"]]: (
		msg: TMessage & { name: TMessageName },
		model: HandlerModel<TVariant, TModel>,
		props: TProps,
		options: UpdateFunctionOptions<TVariant, TProps, TModel, TMessage, TMessage & { name: TMessageName }>,
	) => UpdateReturnType<TVariant, TModel, TMessage>;
};

/**
 * An UpdateMap or an update function.
 */
type Update<TVariant extends Variant, TProps, TModel, TMessage extends Message> =
	| UpdateFunction<TVariant, TProps, TModel, TMessage>
	| UpdateMap<TVariant, TProps, TModel, TMessage>;

export type {
	BaseHandler,
	CallBaseFunction,
	DeferFunction,
	HandlerModel,
	Update,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
	Variant,
};
