import { runSubscription } from "../Common";
import type { Dispatch, Message, Subscription } from "../Types";

/**
 * Executes the subscription.
 * @param subscription The subscription function.
 * @param dispatch The dispatch function which receives the messages.
 * @param model The model.
 * @param props The props.
 * @returns A function to dispose the subscription.
 */
function execSubscription<TProps, TModel, TMessage extends Message>(
	subscription: Subscription<TProps, TModel, TMessage> | undefined,
	dispatch: Dispatch<TMessage>,
	model: TModel,
	props: TProps,
): () => void {
	const dispose = runSubscription(subscription, model, props, dispatch);

	return () => dispose?.();
}

export { execSubscription };
