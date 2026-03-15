import { cmd } from "./cmd";
import { noop } from "./noop";
import type { Cmd } from "./Types";

type Message = { name: "none" } | { name: "success" } | { name: "error" };

const successMsg = (): Message => ({ name: "success" });
const errorMsg = (): Message => ({ name: "error" });

async function asyncResolve(): Promise<void> {
	// Does nothing
}

// biome-ignore lint/suspicious/useAwait: Only for testing purpose.
async function asyncReject(): Promise<void> {
	throw new Error("error");
}

function syncSuccess(): void {
	// Does nothing
}

function syncError(): void {
	throw new Error("error");
}

async function callAsync(result: Cmd<Message>): Promise<Message> {
	const act = async (): Promise<Message> =>
		new Promise((resolve) => {
			result[0]?.(resolve);
		});
	const message = await act();

	return message;
}

describe("cmd", () => {
	describe("batch", () => {
		it("keeps the order", () => {
			// arrange
			const dispatch = jest.fn();

			// act
			const batchedCommands = cmd.batch(cmd.ofMsg(successMsg()), cmd.ofMsg(errorMsg()));

			for (const command of batchedCommands) {
				command(dispatch);
			}

			// assert
			expect(batchedCommands).toHaveLength(2);
			expect(dispatch).toHaveBeenNthCalledWith(1, { name: "success" });
			expect(dispatch).toHaveBeenNthCalledWith(2, { name: "error" });
		});

		it("supports nullish values", () => {
			// arrange
			const dispatch = jest.fn();

			// act
			const batchedCommands = cmd.batch(undefined, cmd.ofMsg(successMsg()), null, cmd.ofMsg(errorMsg()));

			for (const command of batchedCommands) {
				command(dispatch);
			}

			// assert
			expect(batchedCommands).toHaveLength(2);
			expect(dispatch).toHaveBeenNthCalledWith(1, { name: "success" });
			expect(dispatch).toHaveBeenNthCalledWith(2, { name: "error" });
		});
	});

	describe("ofMsg", () => {
		it("returns an empty command for noop", () => {
			// act
			const result = cmd.ofMsg(noop());

			// assert
			expect(result).toHaveLength(0);
		});
	});

	describe("ofEither", () => {
		it("returns one function", () => {
			// arrange
			const result = cmd.ofEither(jest.fn(), successMsg, errorMsg);

			// assert
			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(Function);
		});

		it("runs a sync task", () => {
			// arrange
			const task = jest.fn();
			const result = cmd.ofEither(task, successMsg, errorMsg);

			// act
			result[0]?.(() => null);

			// assert
			expect(task).toHaveBeenCalledTimes(1);
		});

		it("runs an async task", () => {
			// arrange
			const task = jest.fn(asyncResolve);
			const result = cmd.ofEither(task, successMsg, errorMsg);

			// act
			result[0]?.(() => null);

			// assert
			expect(task).toHaveBeenCalledTimes(1);
		});

		it("dispatches the success message for a sync task", async () => {
			// arrange
			const result = cmd.ofEither(syncSuccess, successMsg, errorMsg);

			// act
			const message = await callAsync(result);

			// assert
			expect(message.name).toBe("success");
		});

		it("dispatches the success message for an async task", async () => {
			// arrange
			const result = cmd.ofEither(asyncResolve, successMsg, errorMsg);

			// act
			const message = await callAsync(result);

			// assert
			expect(message.name).toBe("success");
		});

		it("dispatches the error message for a sync task", async () => {
			// arrange
			const result = cmd.ofEither(syncError, successMsg, errorMsg);

			// act
			const message = await callAsync(result);

			// assert
			expect(message.name).toBe("error");
		});

		it("dispatches the error message for an async task", async () => {
			// arrange
			const result = cmd.ofEither(asyncReject, successMsg, errorMsg);

			// act
			const message = await callAsync(result);

			// assert
			expect(message.name).toBe("error");
		});

		it("does not dispatch when ofSuccess returns noop for a sync task", () => {
			// arrange
			const dispatch = jest.fn();
			const result = cmd.ofEither(syncSuccess, () => noop(), errorMsg);

			// act
			result[0]?.(dispatch);

			// assert
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("does not dispatch when ofSuccess returns noop for an async task", async () => {
			// arrange
			const dispatch = jest.fn();
			const result = cmd.ofEither(asyncResolve, () => noop(), errorMsg);

			// act
			result[0]?.(dispatch);
			await Promise.resolve();

			// assert
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("does not dispatch when ofError returns noop for a sync task", () => {
			// arrange
			const dispatch = jest.fn();
			const result = cmd.ofEither(syncError, successMsg, () => noop());

			// act
			result[0]?.(dispatch);

			// assert
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("does not dispatch when ofError returns noop for an async task", async () => {
			// arrange
			const dispatch = jest.fn();
			const result = cmd.ofEither(asyncReject, successMsg, () => noop());

			// act
			result[0]?.(dispatch);
			await Promise.resolve();

			// assert
			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe("ofSuccess", () => {
		it("returns one function", () => {
			// arrange
			const result = cmd.ofSuccess(jest.fn(), successMsg);

			// assert
			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(Function);
		});

		it("runs a sync task", () => {
			// arrange
			const task = jest.fn();
			const result = cmd.ofSuccess(task, successMsg);

			// act
			result[0]?.(() => null);

			// assert
			expect(task).toHaveBeenCalledTimes(1);
		});

		it("runs an async task", () => {
			// arrange
			const task = jest.fn(asyncResolve);
			const result = cmd.ofSuccess(task, successMsg);

			// act
			result[0]?.(() => null);

			// assert
			expect(task).toHaveBeenCalledTimes(1);
		});

		it("dispatches the success message for a sync task", async () => {
			// arrange
			const result = cmd.ofSuccess(syncSuccess, successMsg);

			// act
			const message = await callAsync(result);

			// assert
			expect(message.name).toBe("success");
		});

		it("dispatches the success message for an async task", async () => {
			// arrange
			const result = cmd.ofSuccess(asyncResolve, successMsg);

			// act
			const message = await callAsync(result);

			// assert
			expect(message.name).toBe("success");
		});

		it("ignores the error for a sync task", () => {
			// arrange
			const result = cmd.ofSuccess(syncError, successMsg);

			// act
			const succeeds = (): void => result[0]?.(jest.fn());

			// assert
			expect(succeeds).not.toThrow();
		});

		it("ignores the error for an async task", () => {
			// arrange
			const result = cmd.ofSuccess(asyncReject, successMsg);

			// act
			const succeeds = (): void => result[0]?.(jest.fn());

			// assert
			expect(succeeds).not.toThrow();
		});

		it("does not dispatch when ofSuccess returns noop for a sync task", () => {
			// arrange
			const dispatch = jest.fn();
			const result = cmd.ofSuccess(syncSuccess, () => noop());

			// act
			result[0]?.(dispatch);

			// assert
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("does not dispatch when ofSuccess returns noop for an async task", async () => {
			// arrange
			const dispatch = jest.fn();
			const result = cmd.ofSuccess(asyncResolve, () => noop());

			// act
			result[0]?.(dispatch);
			await Promise.resolve();

			// assert
			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe("ofError", () => {
		it("returns one function", () => {
			// arrange
			const result = cmd.ofError(jest.fn(), errorMsg);

			// assert
			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(Function);
		});

		it("runs a sync task", () => {
			// arrange
			const task = jest.fn();
			const result = cmd.ofError(task, errorMsg);

			// act
			result[0]?.(() => null);

			// assert
			expect(task).toHaveBeenCalledTimes(1);
		});

		it("runs an async task", () => {
			// arrange
			const task = jest.fn(asyncResolve);
			const result = cmd.ofError(task, errorMsg);

			// act
			result[0]?.(() => null);

			// assert
			expect(task).toHaveBeenCalledTimes(1);
		});

		it("dispatches the error message for a sync task", async () => {
			// arrange
			const result = cmd.ofError(syncError, errorMsg);

			// act
			const message = await callAsync(result);

			// assert
			expect(message.name).toBe("error");
		});

		it("dispatches the error message for an async task", async () => {
			// arrange
			const result = cmd.ofError(asyncReject, errorMsg);

			// act
			const message = await callAsync(result);

			// assert
			expect(message.name).toBe("error");
		});

		it("does not dispatch when ofError returns noop for a sync task", () => {
			// arrange
			const dispatch = jest.fn();
			const result = cmd.ofError(syncError, () => noop());

			// act
			result[0]?.(dispatch);

			// assert
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("does not dispatch when ofError returns noop for an async task", async () => {
			// arrange
			const dispatch = jest.fn();
			const result = cmd.ofError(asyncReject, () => noop());

			// act
			result[0]?.(dispatch);
			await Promise.resolve();

			// assert
			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe("ofNone", () => {
		it("runs a sync task", () => {
			// arrange
			const task = jest.fn();
			const result = cmd.ofNone(task);

			// act
			result[0]?.(() => null);

			// assert
			expect(task).toHaveBeenCalledTimes(1);
		});

		it("runs an async task", () => {
			// arrange
			const task = jest.fn(asyncResolve);
			const result = cmd.ofNone(task);

			// act
			result[0]?.(() => null);

			// assert
			expect(task).toHaveBeenCalledTimes(1);
		});

		it("ignores the error for a sync task", () => {
			// arrange
			const result = cmd.ofNone(syncError);

			// act
			const succeeds = (): void => result[0]?.(jest.fn());

			// assert
			expect(succeeds).not.toThrow();
		});

		it("ignores the error for an async task", () => {
			// arrange
			const result = cmd.ofNone(asyncReject);

			// act
			const succeeds = (): void => result[0]?.(jest.fn());

			// assert
			expect(succeeds).not.toThrow();
		});
	});
});
