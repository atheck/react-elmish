import { useLayoutEffect, useRef, useState } from "react";
import {
	bindToInit,
	execCmd,
	getDispatch,
	logMessage,
	runInit,
	useDispose,
	useInitCommands,
	useIsMounted,
	useRedux,
	useReInit,
	useRemount,
	useSubscription,
} from "./Common";
import { getFakeOptions } from "./fakeOptions";
import { Services } from "./Init";
import type { Commands, Dispatch, DisposeFunction, InitFunction, Message, Nullable, Subscription } from "./Types";

/**
 * The options of the `useElmish` hook, which are the same for the mutable and the immutable variant.
 * @template TProps The type of the props.
 * @template TModel The type of the model.
 * @template TMessage The type of the messages discriminated union.
 */
interface UseElmishBaseOptions<TProps, TModel, TMessage extends Message> {
	/**
	 * The name of the component. This is used for logging only.
	 */
	name: string;
	/**
	 * The props passed to the component.
	 */
	props: TProps;
	/**
	 * Array of values that trigger a re-initialization of the component.
	 */
	reInitOn?: unknown[];
	/**
	 * The function to initialize the components model.
	 * It is called when the component is mounted and again whenever the `reInitOn` values change.
	 */
	init: InitFunction<TProps, TModel, TMessage>;
}

/**
 * The parts of `useElmish` which differ between the mutable and the immutable variant.
 * @template TModel The type of the model returned by `init`.
 * @template TStoredModel The type of the model which is stored and passed to the component.
 */
interface ModelHandling<TProps, TModel, TStoredModel, TMessage extends Message> {
	/**
	 * Converts a model returned by `init` or sent by the DevTools to the stored model.
	 */
	toStoredModel: (model: TModel) => TStoredModel;
	/**
	 * Runs the update for a message.
	 * @returns The updated model (the same reference, if nothing has changed) and the commands.
	 */
	updateModel: (model: TStoredModel, msg: TMessage, props: TProps) => [TStoredModel, ...Commands<TMessage>];
}

interface UseElmishBaseParams<TProps, TModel, TStoredModel, TMessage extends Message>
	extends UseElmishBaseOptions<TProps, TModel, TMessage>,
		ModelHandling<TProps, TModel, TStoredModel, TMessage> {
	subscription?: Subscription<TProps, TStoredModel, TMessage>;
	dispose?: DisposeFunction<TStoredModel>;
}

/**
 * The implementation of the `useElmish` hook, shared by the mutable and the immutable variant.
 * @returns A tuple containing the current model and the dispatcher.
 */
function useElmishBase<TProps, TModel, TStoredModel, TMessage extends Message>({
	name,
	props,
	reInitOn,
	init,
	subscription,
	dispose,
	toStoredModel,
	updateModel,
}: UseElmishBaseParams<TProps, TModel, TStoredModel, TMessage>): [TStoredModel, Dispatch<TMessage>] {
	const [model, setModel] = useState<Nullable<TStoredModel>>(null);
	// The dispatch function is created once, so it reads the current values of the options through these refs.
	const optionsRef = useRef({ name, props, updateModel });
	const currentModelRef = useRef<Nullable<TStoredModel>>(null);
	const devToolsRef = useRedux(
		name,
		() => currentModelRef.current,
		(devToolsModel) => {
			// biome-ignore lint/nursery/noUnsafeTypeAssertion: The DevTools send a model which we have sent to them before.
			const storedModel = toStoredModel(devToolsModel as TModel);

			currentModelRef.current = storedModel;
			setModel(storedModel);
		},
	);
	const isMountedRef = useIsMounted();
	const initCountRef = useRef(0);
	const pendingInitCommandsRef = useRef<Nullable<Commands<TMessage>>>(null);
	const isDisposedRef = useRef(false);

	useLayoutEffect(() => {
		optionsRef.current = { name, props, updateModel };
	});

	// Only a component that is initializing may use the fake options of renderWithModel.
	const fakeOptions = model === null ? getFakeOptions<TModel, TMessage>(name) : null;

	// biome-ignore-start lint/nursery/useReactCompiler: The dispatch function must be stable and intentionally captures the mutable model and refs.
	const [dispatch] = useState(() =>
		getDispatch(
			handleMessage,
			() => {
				if (!isMountedRef.current) {
					return;
				}

				Services.logger?.debug("Update model for", optionsRef.current.name, currentModelRef.current);
				setModel(currentModelRef.current);
			},
			(msg) => {
				devToolsRef.current?.send(msg.name, currentModelRef.current);
			},
			fakeOptions?.dispatch,
		),
	);

	let initializedModel = model;

	/* eslint-disable react/refs -- The model is (re-)initialized during render, so the refs must be up to date immediately. */
	if (initializedModel === null) {
		const [rawInitModel, initCommands] = runInit(name, init, props, () => devToolsRef.current, fakeOptions?.model);
		const initModel = toStoredModel(rawInitModel);

		pendingInitCommandsRef.current = initCommands;
		isDisposedRef.current = false;
		currentModelRef.current = initModel;
		initCountRef.current++;
		setModel(initModel);
		initializedModel = initModel;
	}
	/* eslint-enable react/refs */

	const resetModel = (): void => {
		currentModelRef.current = null;
		setModel(null);
	};

	const initDispatch = bindToInit(dispatch, () => initCountRef.current, name);

	useReInit(resetModel, reInitOn);
	// When React mounts the component again (e.g. in StrictMode) after the model has been disposed, we initialize it again.
	useRemount(() => {
		if (!isDisposedRef.current) {
			return;
		}

		resetModel();
	});
	// eslint-disable-next-line react/refs -- The init count only changes in runInit above, during this render.
	useInitCommands(initDispatch, pendingInitCommandsRef, initCountRef.current);
	// eslint-disable-next-line react/refs -- The init count only changes in runInit above, during this render.
	useSubscription(subscription, initializedModel, props, initDispatch, initCountRef.current);
	// biome-ignore-end lint/nursery/useReactCompiler: See above.
	useDispose(dispose, initializedModel, reInitOn, () => {
		isDisposedRef.current = true;
	});

	return [initializedModel, dispatch];

	function handleMessage(msg: TMessage): boolean {
		const currentModel = currentModelRef.current;

		const options = optionsRef.current;

		if (currentModel === null) {
			// The model has been reset and is initialized again with the next render.
			Services.logger?.debug("Dropped message while initializing", options.name, msg);

			return false;
		}

		logMessage(options.name, msg);

		const [updatedModel, ...commands] = options.updateModel(currentModel, msg, options.props);
		const isModified = updatedModel !== currentModel;

		currentModelRef.current = updatedModel;

		execCmd(
			bindToInit(dispatch, () => initCountRef.current, options.name),
			...commands,
		);

		return isModified;
	}
}

export type { ModelHandling, UseElmishBaseOptions };

export { useElmishBase };
