import type { Commands, DeferFunction, Message } from "./Types";

function createDefer<TModel, TMessage extends Message>(): [
	DeferFunction<TModel, TMessage>,
	() => [Partial<TModel>, Commands<TMessage>],
] {
	let deferredModel: Partial<TModel> = {};
	const deferredCommands: Commands<TMessage> = [];

	const defer: DeferFunction<TModel, TMessage> = (tempDeferredModel, ...tempDeferredCommands) => {
		deferredModel = { ...deferredModel, ...tempDeferredModel };
		deferredCommands.push(...tempDeferredCommands);
	};

	return [defer, () => [deferredModel, deferredCommands]];
}

export { createDefer };
