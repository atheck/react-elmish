/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from "react";
import { execCmd, logMessage, modelHasChanged } from "./Common";
import { Services } from "./Init";
import type {
	Cmd,
	Dispatch,
	InitFunction,
	Message,
	Nullable,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateReturnType,
} from "./Types";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import { getFakeOptionsOnce } from "./fakeOptions";

/**
 * The return type of the `subscription` function.
 * @template TMessage The type of the messages discriminated union.
 */
type SubscriptionResult<TMessage> = [Cmd<TMessage>, (() => void)?];
type Subscription<TProps, TModel, TMessage> = (model: TModel, props: TProps) => SubscriptionResult<TMessage>;

/**
 * Options for the `useElmish` hook.
 * @interface UseElmishOptions
 * @template TProps The type of the props.
 * @template TModel The type of the model.
 * @template TMessage The type of the messages discriminated union.
 */
interface UseElmishOptions<TProps, TModel, TMessage extends Message> {
	/**
	 * The name of the component. This is used for logging only.
	 * @type {string}
	 */
	name: string;
	/**
	 * The props passed to the component.
	 * @type {TProps}
	 */
	props: TProps;
	/**
	 * The function to initialize the components model. This function is only called once.
	 * @type {InitFunction<TProps, TModel, TMessage>}
	 */
	init: InitFunction<TProps, TModel, TMessage>;
	/**
	 * The `update` function or update map object.
	 * @type {(UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>)}
	 */
	update: UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>;
	/**
	 * The optional `subscription` function. This function is only called once.
	 * @type {(UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>)}
	 */
	subscription?: Subscription<TProps, TModel, TMessage>;
}

/**
 * Hook to use the Elm architecture pattern in a function component.
 * @param {UseElmishOptions} options The options passed the the hook.
 * @returns A tuple containing the current model and the dispatcher.
 * @example
 * const [model, dispatch] = useElmish({ props, init, update, name: "MyComponent" });
 */
function useElmish<TProps, TModel, TMessage extends Message>({
	name,
	props,
	init,
	update,
	subscription,
}: UseElmishOptions<TProps, TModel, TMessage>): [TModel, Dispatch<TMessage>] {
	let running = false;
	const buffer: TMessage[] = [];
	let currentModel: Partial<TModel> = {};

	const [model, setModel] = useState<Nullable<TModel>>(null);
	const propsRef = useRef(props);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;
		};
	}, []);

	let initializedModel = model;

	if (propsRef.current !== props) {
		propsRef.current = props;
	}

	const fakeOptions = getFakeOptionsOnce();
	const dispatch = useCallback(
		fakeOptions?.dispatch ??
			((msg: TMessage): void => {
				if (running) {
					buffer.push(msg);

					return;
				}

				running = true;

				let nextMsg: TMessage | undefined = msg;
				let modified = false;

				do {
					if (handleMessage(nextMsg)) {
						modified = true;
					}

					nextMsg = buffer.shift();
				} while (nextMsg);

				running = false;

				if (isMountedRef.current && modified) {
					setModel((prevModel) => {
						const updatedModel = { ...(prevModel as TModel), ...currentModel };

						Services.logger?.debug("Update model for", name, updatedModel);

						return updatedModel;
					});
				}
			}),
		[],
	);

	if (!initializedModel) {
		const [initModel, ...initCommands] = fakeOptions?.model ? [fakeOptions.model as TModel] : init(props);

		initializedModel = initModel;
		setModel(initializedModel);

		Services.logger?.debug("Initial model for", name, initializedModel);

		execCmd(dispatch, ...initCommands);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to run this effect only once
	useEffect(() => {
		if (subscription) {
			const [subCmd, destructor] = subscription(initializedModel, props);

			execCmd(dispatch, subCmd);

			return destructor;
		}
	}, []);

	return [initializedModel, dispatch];

	function handleMessage(nextMsg: TMessage): boolean {
		if (!initializedModel) {
			return false;
		}

		let modified = false;

		logMessage(name, nextMsg);

		const updatedModel = { ...initializedModel, ...currentModel };

		const [defer, getDeferred] = createDefer<TModel, TMessage>();
		const callBase = createCallBase(nextMsg, updatedModel, propsRef.current, { defer });

		const [newModel, ...commands] = callUpdate(update, nextMsg, updatedModel, propsRef.current, { defer, callBase });

		const [deferredModel, deferredCommands] = getDeferred();

		if (modelHasChanged(currentModel, { ...deferredModel, ...newModel })) {
			currentModel = { ...currentModel, ...deferredModel, ...newModel };

			modified = true;
		}

		execCmd(dispatch, ...commands, ...deferredCommands);

		return modified;
	}
}

function callUpdate<TProps, TModel, TMessage extends Message>(
	update: UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>,
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
): UpdateReturnType<TModel, TMessage> {
	if (typeof update === "function") {
		return update(model, msg, props, options);
	}

	return callUpdateMap(update, msg, model, props, options);
}

function callUpdateMap<TProps, TModel, TMessage extends Message>(
	updateMap: UpdateMap<TProps, TModel, TMessage>,
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
): UpdateReturnType<TModel, TMessage> {
	const msgName: TMessage["name"] = msg.name;

	return updateMap[msgName](msg, model, props, options);
}

export type { Subscription, SubscriptionResult, UseElmishOptions };

export { callUpdate, callUpdateMap, useElmish };
