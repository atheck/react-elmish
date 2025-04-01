import type { Dispatch } from "react";
import { subscriptionIsFunctionArray, type Message, type Subscription } from "../Types";
import { execCmdWithDispatch } from "./execCmd";

function execSubscription<TProps, TModel, TMessage extends Message>(
	subscription: Subscription<TProps, TModel, TMessage> | undefined,
	dispatch: Dispatch<TMessage>,
	model: TModel,
	props: TProps,
): () => void {
	const noop = (): void => {
		// do nothing
	};

	if (!subscription) {
		return noop;
	}

	const subscriptionResult = subscription(model, props);

	if (subscriptionIsFunctionArray(subscriptionResult)) {
		const disposers = subscriptionResult.map((sub) => sub(dispatch)).filter((disposer) => disposer !== undefined);

		return () => {
			for (const dispose of disposers) {
				dispose();
			}
		};
	}

	const [cmd, dispose] = subscriptionResult;

	execCmdWithDispatch<TMessage>(dispatch, cmd);

	return dispose ?? noop;
}

export { execSubscription };
