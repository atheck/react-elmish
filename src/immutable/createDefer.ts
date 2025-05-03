import type { Cmd, Message } from "../Types";
import type { DeferFunction } from "./Types";

function createDefer<TMessage extends Message>(): [DeferFunction<TMessage>, () => (Cmd<TMessage> | undefined)[]] {
	const deferredCommands: (Cmd<TMessage> | undefined)[] = [];

	const defer: DeferFunction<TMessage> = (...tempDeferredCommands) => {
		deferredCommands.push(...tempDeferredCommands);
	};

	return [defer, () => deferredCommands];
}

export { createDefer };
