import { Dispatch } from "react";
import { Message } from "../Types";
import { Subscription } from "../useElmish";
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

	const [cmd, dispose] = subscription(model, props);

	execCmdWithDispatch<TMessage>(dispatch, cmd);

	return dispose ?? noop;
}

export { execSubscription };
