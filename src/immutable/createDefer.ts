import type { Cmd, Message } from "../Types";
import type { DeferFunction, DraftModelFunction } from "./Types";

function createDefer<TModel, TMessage extends Message>(): [
	DeferFunction<TModel, TMessage>,
	() => [DraftModelFunction<TModel>[], (Cmd<TMessage> | undefined)[]],
] {
	const draftFunctions: DraftModelFunction<TModel>[] = [];
	const deferredCommands: (Cmd<TMessage> | undefined)[] = [];

	const defer: DeferFunction<TModel, TMessage> = (tempDraftFn, ...tempDeferredCommands) => {
		if (tempDraftFn) {
			draftFunctions.push(tempDraftFn);
		}

		deferredCommands.push(...tempDeferredCommands);
	};

	return [defer, () => [draftFunctions, deferredCommands]];
}

export { createDefer };
