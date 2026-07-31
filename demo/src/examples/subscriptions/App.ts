import type { Dispatch, InitResult, SubscriptionResult, UpdateMap, UpdateReturnType } from "react-elmish";

interface Model {
	now: Date;
}

type Props = Record<string, never>;

interface Message {
	name: "tick";
	date: Date;
}

const Msg = {
	tick: (date: Date): Message => ({ name: "tick", date }),
};

function init(): InitResult<Model, Message> {
	return [{ now: new Date() }];
}

const update: UpdateMap<Props, Model, Message> = {
	tick(msg): UpdateReturnType<Model, Message> {
		return [{ now: msg.date }];
	},
};

function subscription(): SubscriptionResult<Message> {
	const sub = (dispatch: Dispatch<Message>) => {
		const timer = setInterval(() => dispatch(Msg.tick(new Date())), 1000);

		return () => {
			clearInterval(timer);
		};
	};

	return [sub];
}

function dispose(model: Model): void {
	// biome-ignore lint/suspicious/noConsole: intentional demonstration that dispose() runs on unmount
	console.info("[Subscriptions example] disposed. Last known time:", model.now.toLocaleTimeString());
}

export type { Message, Model };

export { dispose, init, Msg, subscription, update };
