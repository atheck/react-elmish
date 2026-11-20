import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { Services } from "./Init";
import { isReduxDevToolsEnabled, type ReduxDevTools } from "./reduxDevTools";
import {
	type Cmd,
	type Dispatch,
	type DisposeFunction,
	type InitFunction,
	isSubscriptionFunctionArray,
	type Message,
	type Nullable,
	type Subscription,
} from "./Types";

type InitCommands<TMessage> = (Cmd<TMessage> | undefined)[];

function logMessage(name: string, msg: Message): void {
	Services.logger?.info("Message from", name, msg.name);
	Services.logger?.debug("Message from", name, msg);

	Services.dispatchMiddleware?.(msg);
}

function hasModelChanged<TModel>(currentModel: TModel, model: Partial<TModel>): boolean {
	return !Object.is(model, currentModel) && Object.getOwnPropertyNames(model).length > 0;
}

function execCmd<TMessage>(dispatch: Dispatch<TMessage>, ...commands: (Cmd<TMessage> | undefined)[]): void {
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
function useRedux<TModel>(
	name: string,
	getModel: () => Nullable<TModel>,
	setModel: (model: TModel) => void,
): RefObject<Nullable<ReduxDevTools>> {
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
				// biome-ignore lint/nursery/noUnsafeTypeAssertion: We parse JSON here.
				callbacksRef.current.setModel(JSON.parse(message.state) as TModel);
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
 * Runs the subscription and re-subscribes whenever the model has been (re-)initialized.
 * @param subscription The subscription function.
 * @param model The current model.
 * @param props The current props.
 * @param dispatch The dispatch function.
 * @param initCount The number of times the model has been initialized. A change triggers a re-subscription.
 */
function useSubscription<TProps, TModel, TMessage extends Message>(
	subscription: Subscription<TProps, TModel, TMessage> | undefined,
	model: TModel,
	props: TProps,
	dispatch: Dispatch<TMessage>,
	initCount: number,
): void {
	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to re-subscribe when the model has been re-initialized
	useEffect(() => {
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
	}, [initCount]);
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
 * Calls the init function (or uses the fake model) and passes the initial model and commands to `onInit`.
 * The commands are not executed here, because this runs during render. Use `useInitCommands` to execute them.
 * @returns The initial model.
 */
function runInit<TModel, TProps, TMessage extends Message>(
	name: string,
	initFn: InitFunction<TProps, TModel, TMessage>,
	props: TProps,
	onInit: (model: TModel, commands: InitCommands<TMessage>) => void,
	getDevTools: () => Nullable<ReduxDevTools>,
	fakeModel: TModel | undefined,
): TModel {
	const [initModel, ...initCommands] = fakeModel ? [fakeModel] : initFn(props);

	onInit(initModel, initCommands);
	getDevTools()?.init(initModel);
	Services.logger?.debug("Initial model for", name, initModel);

	return initModel;
}

/**
 * Executes the commands of the last (re-)initialization once, after the component has been rendered.
 * @param dispatch The dispatch function.
 * @param pendingInitCommandsRef The commands which have not been executed yet. They are reset after the execution.
 * @param initCount The number of times the model has been initialized. A change triggers the execution.
 */
function useInitCommands<TMessage>(
	dispatch: Dispatch<TMessage>,
	pendingInitCommandsRef: RefObject<Nullable<InitCommands<TMessage>>>,
	initCount: number,
): void {
	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to execute the commands after a (re-)initialization
	useEffect(() => {
		const commands = pendingInitCommandsRef.current;

		// Reset the commands, so they are not executed again, e.g. when StrictMode runs the effect twice.
		pendingInitCommandsRef.current = null;

		if (commands) {
			execCmd(dispatch, ...commands);
		}
	}, [initCount]);
}

function useDispose<TModel>(dispose: DisposeFunction<TModel> | undefined, model: TModel, reInitOn: unknown[] | undefined): void {
	const modelRef = useRef(model);

	useLayoutEffect(() => {
		modelRef.current = model;
	});

	useEffect(() => {
		if (dispose) {
			return () => {
				dispose(modelRef.current);
			};
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run dispose when the reInitOn dependencies change or on unmount
	}, reInitOn ?? []);
}

export type { InitCommands };

export {
	execCmd,
	getDispatch,
	hasModelChanged,
	logMessage,
	runInit,
	useDispose,
	useInitCommands,
	useIsMounted,
	useRedux,
	useReInit,
	useSubscription,
};
