/* eslint-disable react-hooks/exhaustive-deps */
import { castImmutable, enablePatches, freeze, produce, type Draft, type Immutable } from "immer";
import { useCallback, useEffect, useRef, useState } from "react";
import { execCmd, logMessage } from "../Common";
import { getFakeOptionsOnce } from "../fakeOptions";
import { Services } from "../Init";
import { isReduxDevToolsEnabled, type ReduxDevTools } from "../reduxDevTools";
import { subscriptionIsFunctionArray, type Cmd, type Dispatch, type InitFunction, type Message, type Nullable } from "../Types";
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
}: UseElmishOptions<TProps, TModel, TMessage>): [Immutable<TModel>, Dispatch<TMessage>] {
	let running = false;
	const buffer: TMessage[] = [];

	const [model, setModel] = useState<Nullable<Immutable<TModel>>>(null);
	const propsRef = useRef(props);
	const isMountedRef = useRef(true);

	const devTools = useRef<ReduxDevTools | null>(null);

	useEffect(() => {
		let reduxUnsubscribe: (() => void) | undefined;

		if (Services.enableDevTools === true && isReduxDevToolsEnabled(window)) {
			// eslint-disable-next-line no-underscore-dangle
			devTools.current = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name, serialize: { options: true } });

			reduxUnsubscribe = devTools.current.subscribe((message) => {
				if (message.type === "DISPATCH" && message.payload.type === "JUMP_TO_ACTION") {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
					setModel(JSON.parse(message.state) as Immutable<TModel>);
				}
			});
		}

		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;

			reduxUnsubscribe?.();
		};
	}, [name]);

	let currentModel = model;

	if (propsRef.current !== props) {
		propsRef.current = props;
	}

	const fakeOptions = getFakeOptionsOnce<TModel, TMessage>();
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

					if (devTools.current) {
						devTools.current.send(nextMsg.name, currentModel);
					}

					nextMsg = buffer.shift();
				} while (nextMsg);

				running = false;

				if (isMountedRef.current && modified) {
					setModel(() => {
						Services.logger?.debug("Update model for", name, currentModel);

						return currentModel;
					});
				}
			}),
		[],
	);

	let initializedModel = model;

	if (!initializedModel) {
		enablePatches();

		const [initModel, ...initCommands] = fakeOptions?.model ? [fakeOptions.model] : init(props);

		initializedModel = castImmutable(freeze(initModel, true));
		currentModel = initializedModel;
		setModel(initializedModel);

		devTools.current?.init(initializedModel);

		Services.logger?.debug("Initial model for", name, initializedModel);

		execCmd(dispatch, ...initCommands);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to run this effect only once
	useEffect(() => {
		if (subscription) {
			const subscriptionResult = subscription(initializedModel, props);

			if (subscriptionIsFunctionArray(subscriptionResult)) {
				const destructors = subscriptionResult.map((sub) => sub(dispatch)).filter((destructor) => destructor !== undefined);

				return function combinedDestructor() {
					for (const destructor of destructors) {
						destructor();
					}
				};
			}

			const [subCmd, destructor] = subscriptionResult;

			execCmd(dispatch, subCmd);

			return destructor;
		}
	}, []);

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
