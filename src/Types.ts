import type * as Variant from "./UpdateTypes";

type Nullable<TType> = TType | null;

interface Message {
	name: string;
}

/**
 * Type of the dispatch function.
 */
type Dispatch<TMessage> = (msg: TMessage) => void;

type Sub<TMsg> = (dispatch: Dispatch<TMsg>) => void;

/**
 * Type of a command.
 */
type Cmd<TMessage> = Sub<TMessage>[];

/**
 * A list of commands. `undefined` entries are allowed and ignored, so commands can be added conditionally.
 */
type Commands<TMessage> = (Cmd<TMessage> | undefined)[];

/**
 * Creates a MsgSource type.
 */
interface MsgSource<TSource extends string> {
	source: TSource;
}

/**
 * The return type of the `init` function.
 */
type InitResult<TModel, TMessage> = [TModel, ...Commands<TMessage>];

type InitFunction<TProps, TModel, TMessage> = (props: TProps) => InitResult<TModel, TMessage>;

/**
 * Type for the return value of the `update` function.
 */
type UpdateReturnType<TModel, TMessage> = Variant.UpdateReturnType<"mutable", TModel, TMessage>;

type DeferFunction<TModel, TMessage> = Variant.DeferFunction<"mutable", TModel, TMessage>;

type CallBaseFunction<TModel, TProps, TMessage extends Message> = Variant.CallBaseFunction<"mutable", TModel, TProps, TMessage>;

type BaseHandler<TModel, TProps, TMessage extends Message, TBaseMessage extends Message> = Variant.BaseHandler<
	"mutable",
	TModel,
	TProps,
	TMessage,
	TBaseMessage
>;

type UpdateMapFunction<TProps, TModel, TMessage extends Message> = Variant.UpdateMapFunction<"mutable", TProps, TModel, TMessage>;

type UpdateFunctionOptions<
	TProps,
	TModel,
	TMessage extends Message,
	TCurrentMessage extends Message = TMessage,
> = Variant.UpdateFunctionOptions<"mutable", TProps, TModel, TMessage, TCurrentMessage>;

type UpdateFunction<TProps, TModel, TMessage extends Message> = Variant.UpdateFunction<"mutable", TProps, TModel, TMessage>;

/**
 * Type for mapping messages to functions.
 * Use this type to create your update logic for the useElmish hook.
 */
type UpdateMap<TProps, TModel, TMessage extends Message> = Variant.UpdateMap<"mutable", TProps, TModel, TMessage>;

/**
 * An UpdateMap or an update function.
 * It is a union of the aliases above (and not of the generic variant types), so TypeScript can infer
 * the type arguments from an `UpdateMap` or `UpdateFunction` passed to a generic function.
 */
type Update<TProps, TModel, TMessage extends Message> =
	| UpdateFunction<TProps, TModel, TMessage>
	| UpdateMap<TProps, TModel, TMessage>;

/**
 * The return type of the `subscription` function.
 * @template TMessage The type of the messages discriminated union.
 */
type SubscriptionResult<TMessage> = [Cmd<TMessage>, (() => void)?] | SubscriptionFunction<TMessage>[];
type SubscriptionFunction<TMessage> = (dispatch: Dispatch<TMessage>) => (() => void) | undefined;
type Subscription<TProps, TModel, TMessage> = (model: TModel, props: TProps) => SubscriptionResult<TMessage>;

type DisposeFunction<TModel> = (model: TModel) => void;

function isSubscriptionFunctionArray(subscription: SubscriptionResult<unknown>): subscription is SubscriptionFunction<unknown>[] {
	// An empty array has no command, so it can only be an (empty) array of subscription functions.
	return subscription.length === 0 || typeof subscription[0] === "function";
}

export type {
	BaseHandler,
	CallBaseFunction,
	Cmd,
	Commands,
	DeferFunction,
	Dispatch,
	DisposeFunction,
	InitFunction,
	InitResult,
	Message,
	MsgSource,
	Nullable,
	Sub,
	Subscription,
	SubscriptionFunction,
	SubscriptionResult,
	Update,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
};

export { isSubscriptionFunctionArray };
