import {
	subscriptionIsFunctionArray,
	type Dispatch,
	type Message,
	type Sub,
	type Subscription,
	type SubscriptionFunction,
} from "./Types";

type MergedSubscription<TProps, TModel, TMessage> = (model: TModel, props: TProps) => SubscriptionFunction<TMessage>[];

function mergeSubscriptions<TProps, TModel, TMessage extends Message>(
	...subscriptions: (Subscription<TProps, TModel, TMessage> | undefined)[]
): MergedSubscription<TProps, TModel, TMessage> {
	return function mergedSubscription(model, props) {
		const results = subscriptions.map((sub) => sub?.(model, props)).filter((subscription) => subscription !== undefined);

		const subscriptionFunctions = results.flatMap((result) => {
			if (subscriptionIsFunctionArray(result)) {
				return result;
			}

			const [subCmd, dispose] = result;

			return [...subCmd.map(mapToFn), () => () => dispose?.()];
		});

		return subscriptionFunctions;
	};
}

function mapToFn<TMessage>(cmd: Sub<TMessage>): (dispatch: Dispatch<TMessage>) => undefined {
	return (dispatch) => {
		cmd(dispatch);
	};
}

export { mergeSubscriptions };
