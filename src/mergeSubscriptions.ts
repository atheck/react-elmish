import {
	type Dispatch,
	isSubscriptionFunctionArray,
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
			if (isSubscriptionFunctionArray(result)) {
				return result;
			}

			const [subCmd, dispose] = result;

			// biome-ignore lint/nursery/noMapSpread: We don't expect large arrays here.
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
