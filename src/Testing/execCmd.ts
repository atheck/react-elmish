import { Dispatch } from "react";
import { Cmd, Nullable } from "../Types";

/**
 * Executes all commands and resolves the messages.
 * @param cmd The command to process.
 * @returns The array of processed messages.
 */
async function execCmd<TMessage>(...commands: (Cmd<TMessage> | undefined)[]): Promise<Nullable<TMessage>[]> {
	const definedCommands = commands.filter((cmd) => cmd !== undefined) as Cmd<TMessage>[];
	const callers = definedCommands.flatMap((cmd) =>
		cmd.map(
			async (currentCmd) =>
				new Promise<Nullable<TMessage>>((resolve, reject) => {
					const dispatch = (msg: TMessage): void => resolve(msg);

					currentCmd(dispatch, (error) => {
						if (error) {
							reject(error);
						} else {
							resolve(null);
						}
					});
				}),
		),
	);

	const results = await Promise.all(callers);

	return results;
}

function execCmdWithDispatch<TMessage>(dispatch: Dispatch<TMessage>, ...commands: (Cmd<TMessage> | undefined)[]): void {
	const definedCommands = commands.filter((cmd) => cmd !== undefined) as Cmd<TMessage>[];

	for (const cmd of definedCommands) {
		for (const sub of cmd) {
			sub(dispatch);
		}
	}
}

export { execCmd, execCmdWithDispatch };
