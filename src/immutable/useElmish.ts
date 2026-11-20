import { castImmutable, type Draft, enablePatches, freeze, type Immutable, produce } from "immer";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	execCmd,
	getDispatch,
	logMessage,
	runInit,
	useDispose,
	useIsMounted,
	useRedux,
	useReInit,
	useSubscription,
} from "../Common";
import { getFakeOptionsOnce } from "../fakeOptions";
import { Services } from "../Init";
import type { Cmd, Dispatch, DisposeFunction, InitFunction, Message, Nullable } from "../Types";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import type { DeferFunction, Subscription, UpdateFunction, UpdateFunctionOptions, UpdateMap, UpdateReturnType } from "./Types";

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
	 * @type {DisposeFunction<Immutable<TModel>>}
	 */
	dispose?: DisposeFunction<Immutable<TModel>>;
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
}: UseElmishOptions<TProps, TModel, TMessage>): [Immutable<TModel>, Dispatch<TMessage>] {
	const [model, setModel] = useState<Nullable<Immutable<TModel>>>(null);
	const propsRef = useRef(props);
	const devToolsRef = useRedux(name, setModel);
	const isMountedRef = useIsMounted();
	const currentModelRef = useRef<Nullable<Immutable<TModel>>>(null);
	const initCountRef = useRef(0);

	useLayoutEffect(() => {
		propsRef.current = props;
	});

	const fakeOptions = getFakeOptionsOnce<TModel, TMessage>();

	// biome-ignore-start lint/nursery/useReactCompiler: The dispatch function must be stable and intentionally captures the mutable model and refs.
	const dispatch = useCallback(
		getDispatch(
			handleMessage,
			() => {
				if (!isMountedRef.current) {
					return;
				}

				setModel(() => {
					Services.logger?.debug("Update model for", name, currentModelRef.current);

					return currentModelRef.current;
				});
			},
			(msg) => {
				devToolsRef.current?.send(msg.name, currentModelRef.current);
			},
			fakeOptions?.dispatch,
		),
		[],
	);

	let initializedModel = model;

	if (!initializedModel) {
		enablePatches();

		initializedModel = castImmutable(
			runInit(
				name,
				init,
				props,
				(initModel) => {
					const frozenModel = castImmutable(freeze(initModel, true));

					currentModelRef.current = frozenModel;
					initCountRef.current++;
					setModel(frozenModel);
				},
				dispatch,
				() => devToolsRef.current,
				fakeOptions?.model,
			),
		);
	}

	useReInit(() => {
		currentModelRef.current = null;
		setModel(null);
	}, reInitOn);
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

		logMessage(name, nextMsg);

		const [defer, getDeferred] = createDefer<TMessage>();

		const [isModified, updatedModel, ...commands] = callUpdate(update, nextMsg, currentModel, propsRef.current, defer);

		const deferredCommands = getDeferred();

		currentModelRef.current = updatedModel;

		execCmd(dispatch, ...commands, ...deferredCommands);

		return isModified;
	}
}

function callUpdate<TProps, TModel, TMessage extends Message>(
	update: UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>,
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	defer: DeferFunction<TMessage>,
): [boolean, Immutable<TModel>, ...(Cmd<TMessage> | undefined)[]] {
	const commands: (Cmd<TMessage> | undefined)[] = [];
	let isModified = false;
	const updatedModel = produce(
		model,
		(draft: Draft<TModel>) => {
			const callBase = createCallBase<TProps, TModel, TMessage>(msg, draft, props, { defer });
			const options: UpdateFunctionOptions<TProps, TModel, TMessage> = { defer, callBase };

			if (typeof update === "function") {
				commands.push(...update(draft, msg, props, options));

				return;
			}

			commands.push(...callUpdateMap(update, msg, draft, props, options));
		},
		(patches) => {
			isModified = patches.length > 0;
		},
	);

	return [isModified, updatedModel, ...commands];
}

function callUpdateMap<TProps, TModel, TMessage extends Message>(
	updateMap: UpdateMap<TProps, TModel, TMessage>,
	msg: TMessage,
	model: Draft<TModel>,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
): UpdateReturnType<TMessage> {
	const msgName: TMessage["name"] = msg.name;

	return updateMap[msgName](msg, model, props, options);
}

export type { UseElmishOptions };

export { callUpdateMap, useElmish };
