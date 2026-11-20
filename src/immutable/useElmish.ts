import { castImmutable, freeze, type Immutable } from "immer";
import type { Dispatch, DisposeFunction, Message } from "../Types";
import { type UseElmishBaseOptions, useElmishBase } from "../useElmishBase";
import { runUpdate } from "./runUpdate";
import type { Subscription, UpdateFunction, UpdateMap } from "./Types";

/**
 * Options for the `useElmish` hook.
 * @interface UseElmishOptions
 * @template TProps The type of the props.
 * @template TModel The type of the model.
 * @template TMessage The type of the messages discriminated union.
 */
interface UseElmishOptions<TProps, TModel, TMessage extends Message> extends UseElmishBaseOptions<TProps, TModel, TMessage> {
	/**
	 * The `update` function or update map object.
	 */
	update: UpdateFunction<TProps, TModel, TMessage> | UpdateMap<TProps, TModel, TMessage>;
	/**
	 * The optional `subscription` function.
	 * It is called when the component is mounted and again whenever the `reInitOn` values change.
	 */
	subscription?: Subscription<TProps, TModel, TMessage>;
	/**
	 * The optional `dispose` function. Called when the component unmounts
	 * or when `reInitOn` dependencies change, with the current model.
	 * Use this for cleanup side effects such as closing connections or clearing timers.
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
	update,
	...options
}: UseElmishOptions<TProps, TModel, TMessage>): [Immutable<TModel>, Dispatch<TMessage>] {
	return useElmishBase({
		...options,
		toStoredModel: (model: TModel) => castImmutable(freeze(model, true)),
		updateModel: (model, msg, props) => runUpdate(update, msg, model, props),
	});
}

export type { UseElmishOptions };

export { useElmish };
