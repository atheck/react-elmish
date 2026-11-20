import type { Immutable } from "immer";
import type { Dispatch, Message } from "../../Types";
import { execSubscription as execMutableSubscription } from "../../testing/execSubscription";
import type { Subscription } from "../Types";

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
	model: Immutable<TModel>,
	props: TProps,
): () => void {
	return execMutableSubscription(subscription, dispatch, model, props);
}

export { execSubscription };
