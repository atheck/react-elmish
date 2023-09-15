import { InitResult, Message, Nullable } from "../Types";
import { execCmd } from "./execCmd";

/**
 * Calls the init function, executes all commands, and returns the model and the messages.
 * @param {(props?: TProps) => InitResult<TModel, TMessage>} init The init function.
 * @param {TArgs} [args] The parameters of the init function.
 * @returns {Promise<[TModel, Nullable<TMessage> []]>} The initialized model and the returned messages.
 */
async function initAndExecCmd<TArgs extends unknown[], TModel, TMessage extends Message>(
	init: (...args: TArgs) => InitResult<TModel, TMessage>,
	...args: TArgs
): Promise<[TModel, Nullable<TMessage>[]]> {
	const [model, ...commands] = init(...args);
	const messages = await execCmd(...commands);

	return [model, messages];
}

export { initAndExecCmd };
