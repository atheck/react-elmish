import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	execCmd,
	getDispatch,
	hasModelChanged,
	type InitCommands,
	logMessage,
	runInit,
	useDispose,
	useInitCommands,
	useIsMounted,
	useRedux,
	useReInit,
	useSubscription,
} from "./Common";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import { getFakeOptions } from "./fakeOptions";
import { Services } from "./Init";
import type {
	Dispatch,
	DisposeFunction,
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
	/**
	 * The optional `dispose` function. Called when the component unmounts
	 * or when `reInitOn` dependencies change, with the current model.
	 * Use this for cleanup side effects such as closing connections or clearing timers.
	 * @type {DisposeFunction<TModel>}
	 */
	dispose?: DisposeFunction<TModel>;
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
	dispose,
}: UseElmishOptions<TProps, TModel, TMessage>): [TModel, Dispatch<TMessage>] {
	const [model, setModel] = useState<Nullable<TModel>>(null);
	const propsRef = useRef(props);
	const currentModelRef = useRef<Nullable<TModel>>(null);
	const devToolsRef = useRedux(
		name,
		() => currentModelRef.current,
		(devToolsModel) => {
			currentModelRef.current = devToolsModel;
			setModel(devToolsModel);
		},
	);
	const isMountedRef = useIsMounted();
	const initCountRef = useRef(0);
	const pendingInitCommandsRef = useRef<Nullable<InitCommands<TMessage>>>(null);

	useLayoutEffect(() => {
		propsRef.current = props;
	});

	// Only a component that is initializing may use the fake options of renderWithModel.
	const fakeOptions = model === null ? getFakeOptions<TModel, TMessage>(name) : null;

	// biome-ignore-start lint/nursery/useReactCompiler: The dispatch function must be stable and intentionally captures the mutable model and refs.
	const dispatch = useCallback(
		getDispatch(
			handleMessage,
			() => {
				if (!isMountedRef.current) {
					return;
				}

				setModel((prevModel) => {
					const updatedModel = { ...prevModel, ...currentModelRef.current };

					Services.logger?.debug("Update model for", name, updatedModel);

					// biome-ignore lint/nursery/noUnsafeTypeAssertion: We always have a full model here.
					return updatedModel as TModel;
				});
			},
			(msg) => {
				devToolsRef.current?.send(msg.name, { ...currentModelRef.current });
			},
			fakeOptions?.dispatch,
		),
		[],
	);

	let initializedModel = model;

	initializedModel ??= runInit(
		name,
		init,
		props,
		(initModel, initCommands) => {
			pendingInitCommandsRef.current = initCommands;
			currentModelRef.current = initModel;
			initCountRef.current++;
			setModel(initModel);
		},
		() => devToolsRef.current,
		fakeOptions?.model,
	);

	useReInit(() => {
		currentModelRef.current = null;
		setModel(null);
	}, reInitOn);
	// eslint-disable-next-line react/refs -- The init count only changes in runInit above, during this render.
	useInitCommands(dispatch, pendingInitCommandsRef, initCountRef.current);
	// eslint-disable-next-line react/refs -- The init count only changes in runInit above, during this render.
	useSubscription(subscription, initializedModel, props, dispatch, initCountRef.current);
	// biome-ignore-end lint/nursery/useReactCompiler: See above.
	useDispose(dispose, initializedModel, reInitOn);

	return [initializedModel, dispatch];

	function handleMessage(nextMsg: TMessage): boolean {
		const currentModel = currentModelRef.current;

		if (!currentModel) {
			return false;
		}

		let isModified = false;

		logMessage(name, nextMsg);

		const updatedModel: TModel = { ...currentModel };

		const [defer, getDeferred] = createDefer<TModel, TMessage>();
		const callBase = createCallBase(nextMsg, updatedModel, propsRef.current, { defer });

		const [newModel, ...commands] = callUpdate(update, nextMsg, updatedModel, propsRef.current, { defer, callBase });

		const [deferredModel, deferredCommands] = getDeferred();

		if (hasModelChanged(currentModel, { ...deferredModel, ...newModel })) {
			currentModelRef.current = { ...currentModel, ...deferredModel, ...newModel };

			isModified = true;
		}

		execCmd(dispatch, ...commands, ...deferredCommands);

		return isModified;
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
