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
type UpdateReturnType<TModel, TMessage> = [Partial<TModel>, ...Commands<TMessage>];

type DeferFunction<TModel, TMessage> = (model: Partial<TModel>, ...commands: Commands<TMessage>) => void;
/**
 * Calls the handler of a base module with the current message, model, props, and options.
 * The returned commands keep the message type of the base handler, so they can only be used
 * (e.g. passed to `defer`) if the base messages are part of the messages of the calling component.
 */
type CallBaseFunction<TModel, TProps, TMessage extends Message> = <TBaseMessage extends Message>(
	fn: BaseHandler<TModel, TProps, TMessage, TBaseMessage>,
) => UpdateReturnType<TModel, TBaseMessage>;

/**
 * A handler of a base module which can be called with `callBase`.
 */
type BaseHandler<TModel, TProps, TMessage extends Message, TBaseMessage extends Message> = (
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TBaseMessage, TMessage>,
) => UpdateReturnType<TModel, TBaseMessage>;

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
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
};

export { isSubscriptionFunctionArray };
