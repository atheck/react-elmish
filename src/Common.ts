import { type RefObject, useEffect, useRef } from "react";
import { Services } from "./Init";
import { isReduxDevToolsEnabled, type ReduxDevTools } from "./reduxDevTools";
import {
	type Cmd,
	type Dispatch,
	type InitFunction,
	type Message,
	type Nullable,
	type Subscription,
	subscriptionIsFunctionArray,
} from "./Types";

function logMessage(name: string, msg: Message): void {
	Services.logger?.info("Message from", name, msg.name);
	Services.logger?.debug("Message from", name, msg);

	Services.dispatchMiddleware?.(msg);
}

function modelHasChanged<TModel>(currentModel: TModel, model: Partial<TModel>): boolean {
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
	const devTools = useRef<Nullable<ReduxDevTools>>(null);

	useEffect(() => {
		let reduxUnsubscribe: (() => void) | undefined;

		if (Services.enableDevTools === true && isReduxDevToolsEnabled(window)) {
			// eslint-disable-next-line no-underscore-dangle
			devTools.current = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name, serialize: { options: true } });

			reduxUnsubscribe = devTools.current.subscribe((message) => {
				if (message.type === "DISPATCH" && message.payload.type === "JUMP_TO_ACTION") {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
					setModel(JSON.parse(message.state) as TModel);
				}
			});
		}

		return () => {
			reduxUnsubscribe?.();
		};
	}, [name, setModel]);

	return devTools;
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

function useSubscription<TProps, TModel, TMessage extends Message>(
	subscription: Subscription<TProps, TModel, TMessage> | undefined,
	model: TModel,
	props: TProps,
	dispatch: Dispatch<TMessage>,
	reInitOn: unknown[] | undefined,
): void {
	useEffect(() => {
		if (subscription) {
			const subscriptionResult = subscription(model, props);

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
		// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to reinitialize when the reInitOn dependencies change
	}, reInitOn ?? []);
}

function useReInit(setModel: (model: null) => void, reInitOn: unknown[] | undefined): void {
	const firstCallRef = useRef(true);

	useEffect(() => {
		if (firstCallRef.current) {
			firstCallRef.current = false;

			return;
		}

		setModel(null);
		// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to reinitialize when the reInitOn dependencies change
	}, reInitOn ?? []);
}

function getDispatch<TMessage extends Message>(
	handleMessage: (msg: TMessage) => boolean,
	callSetModel: () => void,
	callDevTools?: (msg: TMessage) => void,
	fakeDispatch?: Dispatch<TMessage>,
): Dispatch<TMessage> {
	let running = false;
	const buffer: TMessage[] = [];

	return (
		fakeDispatch ??
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

				callDevTools?.(nextMsg);

				nextMsg = buffer.shift();
			} while (nextMsg);

			running = false;

			if (modified) {
				callSetModel();
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
	devTools: Nullable<ReduxDevTools>,
	fakeModel: TModel | undefined,
): TModel {
	const [initModel, ...initCommands] = fakeModel ? [fakeModel] : initFn(props);

	setModel(initModel);
	devTools?.init(initModel);
	Services.logger?.debug("Initial model for", name, initModel);
	execCmd(dispatch, ...initCommands);

	return initModel;
}

export { execCmd, logMessage, modelHasChanged, useRedux, useIsMounted, useSubscription, useReInit, getDispatch, runInit };
