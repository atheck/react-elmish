import type { Cmd, Nullable, Sub } from "../Types";
import { isPromiseLike } from "./isPromiseLike";

/**
 * Executes all commands and resolves the messages.
 * A command is finished when it returns, or, if it returns a promise, when the promise is settled.
 * @param cmd The command to process.
 * @returns The array of dispatched messages in order, with `null` for every command which did not dispatch a message.
 */
async function execCmd<TMessage>(...commands: (Cmd<TMessage> | undefined)[]): Promise<Nullable<TMessage>[]> {
	const subs = commands.filter((cmd) => cmd !== undefined).flat();
	const results = await Promise.all(subs.map(execSub));

	return results.flat();
}

async function execSub<TMessage>(sub: Sub<TMessage>): Promise<Nullable<TMessage>[]> {
	const messages: TMessage[] = [];
	let fallbackError: Error | undefined;

	const result: unknown = sub(
		(msg) => {
			messages.push(msg);
		},
		(error) => {
			fallbackError ??= error;
		},
	);

	if (isPromiseLike(result)) {
		await result;
	}

	if (fallbackError) {
		throw fallbackError;
	}

	return messages.length > 0 ? [...messages] : [null];
}

export { execCmd as execCmdWithDispatch } from "../Common";

export { execCmd };
