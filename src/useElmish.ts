import { useCallback, useRef, useState } from "react";
import {
	execCmd,
	getDispatch,
	logMessage,
	modelHasChanged,
	runInit,
	useIsMounted,
	useRedux,
	useReInit,
	useSubscription,
} from "./Common";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import { getFakeOptionsOnce } from "./fakeOptions";
import { Services } from "./Init";
import type {
	Dispatch,
	InitFunction,
	Message,
	Nullable,
	Subscription,
	UpdateFunction,
	UpdateFunctionOptions,
	UpdateMap,
	UpdateReturnType,
} from "./Types";

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
	 * Array of values that trigger a re-initialization of the component.
	 */
	reInitOn?: unknown[];
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
	reInitOn,
	init,
	update,
	subscription,
}: UseElmishOptions<TProps, TModel, TMessage>): [TModel, Dispatch<TMessage>] {
	const [model, setModel] = useState<Nullable<TModel>>(null);
	const propsRef = useRef(props);
	const devToolsRef = useRedux(name, setModel);
	const isMountedRef = useIsMounted();

	let currentModel = model;

	if (propsRef.current !== props) {
		propsRef.current = props;
	}

	const fakeOptions = getFakeOptionsOnce<TModel, TMessage>();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const dispatch = useCallback(
		getDispatch(
			handleMessage,
			() => {
				if (!isMountedRef.current) {
					return;
				}

				setModel((prevModel) => {
					const updatedModel = { ...prevModel, ...currentModel };

					Services.logger?.debug("Update model for", name, updatedModel);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- We always have a full model here
					return updatedModel as TModel;
				});
			},
			(msg) => {
				devToolsRef.current?.send(msg.name, { ...currentModel });
			},
			fakeOptions?.dispatch,
		),
		[],
	);

	let initializedModel = currentModel;

	initializedModel ??= runInit(
		name,
		init,
		props,
		(initModel) => {
			currentModel = initModel;
			setModel(currentModel);
		},
		dispatch,
		devToolsRef.current,
		fakeOptions?.model,
	);

	useReInit(setModel, reInitOn);
	useSubscription(subscription, initializedModel, props, dispatch, reInitOn);

	return [initializedModel, dispatch];

	function handleMessage(nextMsg: TMessage): boolean {
		if (!currentModel) {
			return false;
		}

		let modified = false;

		logMessage(name, nextMsg);

		const updatedModel = { ...currentModel } as TModel;

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

export type { UseElmishOptions };

export { callUpdate, callUpdateMap, useElmish };
