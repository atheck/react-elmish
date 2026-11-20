import type { Commands, Message } from "../Types";
import type { DeferFunction } from "./Types";

function createDefer<TMessage extends Message>(): [DeferFunction<TMessage>, () => Commands<TMessage>] {
	const deferredCommands: Commands<TMessage> = [];

	const defer: DeferFunction<TMessage> = (...tempDeferredCommands) => {
		deferredCommands.push(...tempDeferredCommands);
	};

	return [defer, () => deferredCommands];
}

export { createDefer };
