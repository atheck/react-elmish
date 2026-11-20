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

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- We need to type Model.
function useRedux<TModel>(name: string, setModel: (model: TModel) => void): RefObject<Nullable<ReduxDevTools>> {
	const devToolsRef = useRef<Nullable<ReduxDevTools>>(null);

	useEffect(() => {
		let reduxUnsubscribe: (() => void) | undefined;

		if (Services.enableDevTools === true && isReduxDevToolsEnabled(window)) {
			// eslint-disable-next-line no-underscore-dangle
			devToolsRef.current = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name, serialize: { options: true } });

			reduxUnsubscribe = devToolsRef.current.subscribe((message) => {
				if (message.type === "DISPATCH" && message.payload.type === "JUMP_TO_ACTION") {
					// biome-ignore lint/nursery/noUnsafeTypeAssertion: We parse JSON here.
					setModel(JSON.parse(message.state) as TModel);
				}
			});
		}

		return () => {
			reduxUnsubscribe?.();
		};
	}, [name, setModel]);

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

function useReInit(resetModel: () => void, reInitOn: unknown[] | undefined): void {
	const firstCallRef = useRef(true);

	useEffect(() => {
		if (firstCallRef.current) {
			firstCallRef.current = false;

			return;
		}

		resetModel();
		// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to reinitialize when the reInitOn dependencies change
	}, reInitOn ?? []);
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

function runInit<TModel, TProps, TMessage extends Message>(
	name: string,
	initFn: InitFunction<TProps, TModel, TMessage>,
	props: TProps,
	setModel: (model: TModel) => void,
	dispatch: Dispatch<TMessage>,
	getDevTools: () => Nullable<ReduxDevTools>,
	fakeModel: TModel | undefined,
): TModel {
	const [initModel, ...initCommands] = fakeModel ? [fakeModel] : initFn(props);

	setModel(initModel);
	getDevTools()?.init(initModel);
	Services.logger?.debug("Initial model for", name, initModel);
	execCmd(dispatch, ...initCommands);

	return initModel;
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

export {
	execCmd,
	getDispatch,
	hasModelChanged,
	logMessage,
	runInit,
	useDispose,
	useIsMounted,
	useRedux,
	useReInit,
	useSubscription,
};
