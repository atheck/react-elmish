import type { Cmd, DeferFunction, Message } from "./Types";

function createDefer<TModel, TMessage extends Message>(): [
	DeferFunction<TModel, TMessage>,
	() => [Partial<TModel>, (Cmd<TMessage> | undefined)[]],
] {
	let deferredModel: Partial<TModel> = {};
	const deferredCommands: (Cmd<TMessage> | undefined)[] = [];

	const defer: DeferFunction<TModel, TMessage> = (tempDeferredModel, ...tempDeferredCommands) => {
		deferredModel = { ...deferredModel, ...tempDeferredModel };
		deferredCommands.push(...tempDeferredCommands);
	};

	return [defer, () => [deferredModel, deferredCommands]];
}

export { createDefer };
