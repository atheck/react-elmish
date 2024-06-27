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
type UpdateMapFunction<TProps, TModel, TMessage extends Message> = (
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
) => UpdateReturnType<TModel, TMessage>;

interface UpdateFunctionOptions<TProps, TModel, TMessage extends Message> {
	defer: DeferFunction<TModel, TMessage>;
	// biome-ignore lint/suspicious/noExplicitAny: Didn't find a better solution for now.
	callBase: (fn: UpdateMapFunction<TProps, TModel, any>) => UpdateReturnType<TModel, TMessage>;
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
		options: UpdateFunctionOptions<TProps, TModel, TMessage>,
	) => UpdateReturnType<TModel, TMessage>;
};

export type {
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
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateMapFunction,
	UpdateReturnType,
};
