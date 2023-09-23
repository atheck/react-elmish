import { Dispatch } from "react";
import { Message } from "../Types";
import { Subscription } from "../useElmish";
import { execCmdWithDispatch } from "./execCmd";

function runSubscription<TProps, TModel, TMessage extends Message>(
	subscription: Subscription<TProps, TModel, TMessage>,
	dispatch: Dispatch<TMessage>,
	model: TModel,
	props: TProps,
): (() => void) | undefined {
	const [cmd, dispose] = subscription(model, props);

	execCmdWithDispatch<TMessage>(dispatch, cmd);

	return dispose;
}

export { runSubscription };
