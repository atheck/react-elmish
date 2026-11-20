import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { Services } from "./Init";
import { isReduxDevToolsEnabled, type ReduxDevTools } from "./reduxDevTools";
import {
	type Commands,
	type Dispatch,
	type DisposeFunction,
	type InitFunction,
	isSubscriptionFunctionArray,
	type Message,
	type Nullable,
	type Subscription,
} from "./Types";

/**
 * The parts of the model handling which differ between the mutable and the immutable variant.
 * Shared by `useElmish` and `ElmComponent`.
 * @template TModel The type of the model returned by `init`.
 * @template TStoredModel The type of the model which is stored and passed to the component.
 * @template TUpdate The type of the update function or UpdateMap.
 */
interface ModelHandling<TProps, TModel, TStoredModel, TMessage extends Message, TUpdate> {
	/**
	 * Converts a model returned by `init` or sent by the DevTools to the stored model.
	 */
	toStoredModel: (model: TModel) => TStoredModel;
	/**
	 * Runs the update for a message.
	 * @returns The updated model (the same reference, if nothing has changed) and the commands.
	 */
	updateModel: (update: TUpdate, msg: TMessage, model: TStoredModel, props: TProps) => [TStoredModel, ...Commands<TMessage>];
}

function logMessage(name: string, msg: Message): void {
	Services.logger?.info("Message from", name, msg.name);
	Services.logger?.debug("Message from", name, msg);

	Services.dispatchMiddleware?.(msg);
}

/**
 * Checks if an update returned model changes.
 * Every returned property counts as a change, even if its value is the same, so a nested value which was modified in place is rendered, too.
 * @param changes The model changes returned by an update.
 * @returns Whether there are model changes.
 */
function hasModelChanged<TModel>(changes: Partial<TModel>): boolean {
	return Object.getOwnPropertyNames(changes).length > 0;
}

function execCmd<TMessage>(dispatch: Dispatch<TMessage>, ...commands: Commands<TMessage>): void {
	for (const call of commands.flat()) {
		if (call) {
			call(dispatch);
		}
	}
}

/**
 * Connects the component to the Redux DevTools, if they are enabled.
 * @param name The name of the component.
 * @param getModel Returns the current model. It is sent to the DevTools when connecting.
 * @param setModel Sets the current model, when the DevTools jump to another state.
 * @returns A ref to the DevTools connection.
 */
function useRedux(name: string, getModel: () => unknown, setModel: (model: unknown) => void): RefObject<Nullable<ReduxDevTools>> {
	const devToolsRef = useRef<Nullable<ReduxDevTools>>(null);
	const callbacksRef = useRef({ getModel, setModel });

	useLayoutEffect(() => {
		callbacksRef.current = { getModel, setModel };
	});

	useEffect(() => {
		if (!(Services.enableDevTools === true && isReduxDevToolsEnabled(window))) {
			return;
		}

		// eslint-disable-next-line no-underscore-dangle
		const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name, serialize: { options: true } });

		devToolsRef.current = devTools;
		// The model is initialized during the first render, before we are connected, so we send it now.
		devTools.init(callbacksRef.current.getModel());

		const reduxUnsubscribe = devTools.subscribe((message) => {
			if (message.type === "DISPATCH" && message.payload.type === "JUMP_TO_ACTION") {
				callbacksRef.current.setModel(JSON.parse(message.state));
			}
		});

		return () => {
			reduxUnsubscribe();
			devToolsRef.current = null;
		};
	}, [name]);

	return devToolsRef;
}

function useIsMounted(): RefObject<boolean> {
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return isMountedRef;
}

/**
 * Runs the subscription.
 * @param subscription The subscription function.
 * @param model The current model.
 * @param props The current props.
 * @param dispatch The dispatch function.
 * @returns A function to dispose the subscription, if there is one.
 */
function runSubscription<TProps, TModel, TMessage extends Message>(
	subscription: Subscription<TProps, TModel, TMessage> | undefined,
	model: TModel,
	props: TProps,
	dispatch: Dispatch<TMessage>,
): (() => void) | undefined {
	if (!subscription) {
		return;
	}

	const subscriptionResult = subscription(model, props);

	if (isSubscriptionFunctionArray(subscriptionResult)) {
		const destructors = subscriptionResult.map((sub) => sub(dispatch)).filter((current) => current !== undefined);

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

/**
 * Runs the subscription and re-subscribes whenever the model has been (re-)initialized.
 * @param subscription The subscription function.
 * @param model The current model.
 * @param props The current props.
 * @param initDispatch The dispatch function of the current initialization. A change triggers a re-subscription.
 */
function useSubscription<TProps, TModel, TMessage extends Message>(
	subscription: Subscription<TProps, TModel, TMessage> | undefined,
	model: TModel,
	props: TProps,
	initDispatch: Dispatch<TMessage>,
): void {
	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to re-subscribe when the model has been re-initialized
	useEffect(() => runSubscription(subscription, model, props, initDispatch), [initDispatch]);
}

/**
 * Resets the model when the `reInitOn` values change, so the component is initialized again.
 * @param resetModel Resets the model.
 * @param reInitOn The values which trigger a re-initialization.
 */
function useReInit(resetModel: () => void, reInitOn: unknown[] | undefined): void {
	const lastReInitOnRef = useRef(reInitOn);

	useEffect(() => {
		const lastReInitOn = lastReInitOnRef.current;

		lastReInitOnRef.current = reInitOn;

		// The effect also runs when the component is mounted, and twice in StrictMode, without a change of the values.
		if (areValuesEqual(lastReInitOn, reInitOn)) {
			return;
		}

		resetModel();
		// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to reinitialize when the reInitOn dependencies change
	}, reInitOn ?? []);
}

function areValuesEqual(first: unknown[] | undefined, second: unknown[] | undefined): boolean {
	if (first === second) {
		return true;
	}

	if (!(first && second) || first.length !== second.length) {
		return false;
	}

	return first.every((value, index) => Object.is(value, second[index]));
}

/**
 * Creates the dispatch function for the commands and subscriptions of one initialization of the model.
 * Its messages are dropped once the model has been initialized again (e.g. after `reInitOn` changed),
 * so the results of a previous initialization do not end up in the new model.
 * Create it once per initialization and reuse it, so its identity marks the initialization.
 * @param dispatch The dispatch function of the component.
 * @param isCurrent Returns whether the passed dispatch function belongs to the current initialization.
 * @param name The name of the component, used for logging.
 * @returns The dispatch function of this initialization.
 */
function createInitDispatch<TMessage extends Message>(
	dispatch: Dispatch<TMessage>,
	isCurrent: (initDispatch: Dispatch<TMessage>) => boolean,
	name: string,
): Dispatch<TMessage> {
	const initDispatch: Dispatch<TMessage> = (msg) => {
		if (!isCurrent(initDispatch)) {
			Services.logger?.debug("Dropped message of a previous initialization of", name, msg);

			return;
		}

		dispatch(msg);
	};

	return initDispatch;
}

function getDispatch<TMessage extends Message>(
	handleMessage: (msg: TMessage) => boolean,
	callSetModel: () => void,
	callDevTools?: (msg: TMessage) => void,
	fakeDispatch?: Dispatch<TMessage>,
): Dispatch<TMessage> {
	let isRunning = false;
	const buffer: TMessage[] = [];

	return (
		fakeDispatch ??
		((msg: TMessage): void => {
			if (isRunning) {
				buffer.push(msg);

				return;
			}

			isRunning = true;

			let nextMsg: TMessage | undefined = msg;
			let isModified = false;
			let hasFailed = true;

			try {
				do {
					if (handleMessage(nextMsg)) {
						isModified = true;
					}

					callDevTools?.(nextMsg);

					// eslint-disable-next-line unicorn/no-array-front-mutation -- We need to remove messages from the start.
					nextMsg = buffer.shift();
				} while (nextMsg);

				hasFailed = false;
			} finally {
				if (hasFailed) {
					// Drop the messages queued by the failed run, so they are not processed out of order later.
					buffer.length = 0;
				}

				isRunning = false;

				if (isModified) {
					callSetModel();
				}
			}
		})
	);
}

/**
 * Calls the init function (or uses the fake model).
 * The commands are not executed here, because this runs during render. Use `useInitCommands` to execute them.
 * @returns The initial model and the init commands.
 */
function runInit<TModel, TProps, TMessage extends Message>(
	name: string,
	initFn: InitFunction<TProps, TModel, TMessage>,
	props: TProps,
	getDevTools: () => Nullable<ReduxDevTools>,
	fakeModel: TModel | undefined,
): [TModel, Commands<TMessage>] {
	const [initModel, ...initCommands] = fakeModel ? [fakeModel] : initFn(props);

	getDevTools()?.init(initModel);
	Services.logger?.debug("Initial model for", name, initModel);

	return [initModel, initCommands];
}

/**
 * Executes the commands of the last (re-)initialization once, after the component has been rendered.
 * @param initDispatch The dispatch function of the current initialization. A change triggers the execution.
 * @param pendingInitCommandsRef The commands which have not been executed yet. They are reset after the execution.
 */
function useInitCommands<TMessage>(
	initDispatch: Dispatch<TMessage>,
	pendingInitCommandsRef: RefObject<Nullable<Commands<TMessage>>>,
): void {
	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to execute the commands after a (re-)initialization
	useEffect(() => {
		const commands = pendingInitCommandsRef.current;

		// Reset the commands, so they are not executed again, e.g. when StrictMode runs the effect twice.
		pendingInitCommandsRef.current = null;

		if (commands) {
			execCmd(initDispatch, ...commands);
		}
	}, [initDispatch]);
}

/**
 * Calls the dispose function with the current model when the component unmounts or the `reInitOn` values change.
 * @param dispose The dispose function.
 * @param currentModelRef The ref to the current model. It is read when disposing, so the model changes of messages
 * which have not been rendered yet are included. It is `null` if the model has already been disposed and reset.
 * @param reInitOn The values which trigger a re-initialization.
 * @param onDisposed Is called after the dispose function has been called.
 */
function useDispose<TModel>(
	dispose: DisposeFunction<TModel> | undefined,
	currentModelRef: RefObject<Nullable<TModel>>,
	reInitOn: unknown[] | undefined,
	onDisposed: () => void,
): void {
	// The cleanup runs later, so it reads the latest values through this ref.
	const latestRef = useRef({ dispose, onDisposed });

	useLayoutEffect(() => {
		latestRef.current = { dispose, onDisposed };
	});

	useEffect(
		() => () => {
			const latest = latestRef.current;
			const model = currentModelRef.current;

			if (model === null || !latest.dispose) {
				return;
			}

			latest.dispose(model);
			latest.onDisposed();
		},
		// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run dispose when the reInitOn dependencies change or on unmount
		reInitOn ?? [],
	);
}

/**
 * Calls `onRemount` when React mounts the component again after it has been unmounted, e.g. in StrictMode.
 * @param onRemount Is called on every mount except the first one.
 */
function useRemount(onRemount: () => void): void {
	const isFirstMountRef = useRef(true);
	const onRemountRef = useRef(onRemount);

	useLayoutEffect(() => {
		onRemountRef.current = onRemount;
	});

	useEffect(() => {
		if (isFirstMountRef.current) {
			isFirstMountRef.current = false;

			return;
		}

		onRemountRef.current();
	}, []);
}

export type { ModelHandling };

export {
	createInitDispatch,
	execCmd,
	getDispatch,
	hasModelChanged,
	logMessage,
	runInit,
	runSubscription,
	useDispose,
	useInitCommands,
	useIsMounted,
	useRedux,
	useReInit,
	useRemount,
	useSubscription,
};
