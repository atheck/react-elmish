import { castImmutable, type Draft, enablePatches, freeze, type Immutable, produce } from "immer";
import { useCallback, useRef, useState } from "react";
import { execCmd, getDispatch, logMessage, runInit, useIsMounted, useRedux, useReInit, useSubscription } from "../Common";
import { getFakeOptionsOnce } from "../fakeOptions";
import { Services } from "../Init";
import type { Cmd, Dispatch, InitFunction, Message, Nullable } from "../Types";
import { createCallBase } from "./createCallBase";
import { createDefer } from "./createDefer";
import type { Subscription, UpdateFunction, UpdateFunctionOptions, UpdateMap, UpdateReturnType } from "./Types";

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
}: UseElmishOptions<TProps, TModel, TMessage>): [Immutable<TModel>, Dispatch<TMessage>] {
	const [model, setModel] = useState<Nullable<Immutable<TModel>>>(null);
	const propsRef = useRef(props);
	const devToolsRef = useRedux(name, setModel);
	const isMountedRef = useIsMounted();

	let currentModel = model;

	if (propsRef.current !== props) {
		propsRef.current = props;
	}

	const fakeOptions = getFakeOptionsOnce<TModel, TMessage>();

	const dispatch = useCallback(
		getDispatch(
			handleMessage,
			() => {
				if (!isMountedRef.current) {
					return;
				}

				setModel(() => {
					Services.logger?.debug("Update model for", name, currentModel);

					return currentModel;
				});
			},
			(msg) => {
				devToolsRef.current?.send(msg.name, currentModel);
			},
			fakeOptions?.dispatch,
		),
		[],
	);

	let initializedModel = currentModel;

	if (!initializedModel) {
		enablePatches();

		initializedModel = castImmutable(
			runInit(
				name,
				init,
				props,
				(initModel) => {
					currentModel = castImmutable(freeze(initModel, true));
					setModel(currentModel);
				},
				dispatch,
				devToolsRef.current,
				fakeOptions?.model,
			),
		);
	}

	useReInit(setModel, reInitOn);
	useSubscription(subscription, initializedModel, props, dispatch, reInitOn);

	return [initializedModel, dispatch];

	function handleMessage(nextMsg: TMessage): boolean {
		if (!currentModel) {
			return false;
		}

		logMessage(name, nextMsg);

		const [defer, getDeferred] = createDefer<TMessage>();
		const callBase = createCallBase<TProps, TModel, TMessage>(nextMsg, currentModel, propsRef.current, { defer });

		const [modified, updatedModel, ...commands] = callUpdate(update, nextMsg, currentModel, propsRef.current, {
			defer,
			callBase,
		});

		const deferredCommands = getDeferred();

		currentModel = updatedModel;

		execCmd(dispatch, ...commands, ...deferredCommands);

		return modified;
	}
}

function callUpdate<TProps, TModel, TMessage extends Message>(
	update: UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>,
	msg: TMessage,
	model: Immutable<TModel>,
	props: TProps,
	options: UpdateFunctionOptions<TProps, TModel, TMessage>,
): [boolean, Immutable<TModel>, ...(Cmd<TMessage> | undefined)[]] {
	const commands: (Cmd<TMessage> | undefined)[] = [];
	let modified = false;
	const updatedModel = produce(
		model,
		(draft: Draft<TModel>) => {
			if (typeof update === "function") {
				commands.push(...update(draft, msg, props, options));

				return;
			}

			commands.push(...callUpdateMap(update, msg, draft, props, options));
		},
		(patches) => {
			modified = patches.length > 0;
		},
	);

	return [modified, updatedModel, ...commands];
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
