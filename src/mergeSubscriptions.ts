import { cmd } from "./cmd";
import type { Message } from "./Types";
import type { Subscription } from "./useElmish";

function mergeSubscriptions<TProps, TModel, TMessage extends Message>(
	...subscriptions: (Subscription<TProps, TModel, TMessage> | undefined)[]
): Subscription<TProps, TModel, TMessage> {
	return function mergedSubscription(model, props) {
		const results = subscriptions.map((sub) => sub?.(model, props));

		const commands = results.map((sub) => sub?.[0]);
		const disposers = results.map((sub) => sub?.[1]);

		return [
			cmd.batch(...commands),
			() => {
				for (const disposer of disposers) {
					disposer?.();
				}
			},
		];
	};
}

export { mergeSubscriptions };
