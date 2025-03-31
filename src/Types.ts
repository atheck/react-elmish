type Nullable<TType> = TType | null;

interface Message {
	name: string;
}

/**
 * Type of the dispatch function.
 */
type Dispatch<TMessage> = (msg: TMessage) => void;

type FallbackHandler = (error?: Error) => void;
type Sub<TMsg> = (dispatch: Dispatch<TMsg>, fallback?: FallbackHandler) => void;

/**
 * Type of a command.
 */
type Cmd<TMessage> = Sub<TMessage>[];

/**
 * Creates a MsgSource type.
 */
interface MsgSource<TSource extends string> {
	source: TSource;
}

/**
 * The return type of the `init` function.
 */
type InitResult<TModel, TMessage> = [TModel, ...(Cmd<TMessage> | undefined)[]];

type InitFunction<TProps, TModel, TMessage> = (props: TProps) => InitResult<TModel, TMessage>;

/**
 * Type for the return value of the `update` function.
 */
type UpdateReturnType<TModel, TMessage> = [Partial<TModel>, ...(Cmd<TMessage> | undefined)[]];

type DeferFunction<TModel, TMessage> = (model: Partial<TModel>, ...commands: (Cmd<TMessage> | undefined)[]) => void;
type CallBaseFunction<TModel, TProps, TMessage extends Message> = (
	fn: (
		msg: TMessage,
		model: TModel,
		props: TProps,
		// biome-ignore lint/suspicious/noExplicitAny: any is needed here to allow options of any type
		...args: any[]
	) => UpdateReturnType<TModel, Message>,
) => UpdateReturnType<TModel, TMessage>;

type UpdateMapFunction<TProps, TModel, TMessage extends Message> = (
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
) => UpdateReturnType<TModel, TMessage>;

interface UpdateFunctionOptions<TProps, TModel, TMessage extends Message, TSpecificMessage extends Message = TMessage> {
	defer: DeferFunction<TModel, TMessage>;
	callBase: CallBaseFunction<TModel, TProps, TSpecificMessage>;
}

type UpdateFunction<TProps, TModel, TMessage extends Message> = (
	model: TModel,
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
		model: TModel,
		props: TProps,
		options: UpdateFunctionOptions<TProps, TModel, TMessage, TMessage & { name: TMessageName }>,
	) => UpdateReturnType<TModel, TMessage>;
};

/**
 * The return type of the `subscription` function.
 * @template TMessage The type of the messages discriminated union.
 */
type SubscriptionResult<TMessage> = [Cmd<TMessage>, (() => void)?] | SubscriptionFunction<TMessage>[];
type SubscriptionFunction<TMessage> = (dispatch: Dispatch<TMessage>) => (() => void) | undefined;
type Subscription<TProps, TModel, TMessage> = (model: TModel, props: TProps) => SubscriptionResult<TMessage>;

function subscriptionIsFunctionArray(subscription: SubscriptionResult<unknown>): subscription is SubscriptionFunction<unknown>[] {
	return typeof subscription[0] === "function";
}

export type {
	CallBaseFunction,
	Cmd,
	DeferFunction,
	Dispatch,
	FallbackHandler,
	InitFunction,
	InitResult,
	Message,
	MsgSource,
	Nullable,
	Sub,
	Subscription,
	SubscriptionFunction,
	SubscriptionResult,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
};

export { subscriptionIsFunctionArray };
