import { execCmd } from ".";
import { cmd } from "../cmd";

type Message = { name: "Msg1" } | { name: "Msg2" } | { name: "Error" };

describe("execCmd", () => {
	it("returns an empty array without a cmd", async () => {
		// act
		const messages = await execCmd();

		// assert
		expect(messages).toStrictEqual([]);
	});

	it("executes all message commands", async () => {
		// arrange
		const commands = cmd.batch(cmd.ofMsg({ name: "Msg1" }), cmd.ofMsg({ name: "Msg2" }));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Msg1" }, { name: "Msg2" }]);
	});

	it("executes all ofFunc commands", async () => {
		// arrange
		const func = (): void => {
			// blank
		};

		const commands = cmd.batch(
			cmd.ofEither(
				func,
				() => ({ name: "Msg1" }),
				() => ({ name: "Error" }),
			),
			cmd.ofMsg({ name: "Msg2" }),
		);

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Msg1" }, { name: "Msg2" }]);
	});

	it("executes all ofFunc commands, fail", async () => {
		// arrange
		const func = (): void => {
			throw new Error("error");
		};

		const commands = cmd.batch(
			cmd.ofEither(
				func,
				() => ({ name: "Msg1" }),
				() => ({ name: "Error" }),
			),
			cmd.ofMsg({ name: "Msg2" }),
		);

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Error" }, { name: "Msg2" }]);
	});

	it("executes all ofPromise commands", async () => {
		// arrange
		const asyncFunc = async (): Promise<void> => undefined;

		const commands = cmd.batch(
			cmd.ofEither(
				asyncFunc,
				() => ({ name: "Msg1" }),
				() => ({ name: "Error" }),
			),
			cmd.ofMsg({ name: "Msg2" }),
		);

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Msg1" }, { name: "Msg2" }]);
	});

	it("executes all ofPromise commands, fail", async () => {
		// arrange
		const asyncFunc = async (): Promise<void> => {
			throw new Error("error");
		};

		const commands = cmd.batch(
			cmd.ofEither(
				asyncFunc,
				() => ({ name: "Msg1" }),
				() => ({ name: "Error" }),
			),
			cmd.ofMsg({ name: "Msg2" }),
		);

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Error" }, { name: "Msg2" }]);
	});

	it("resolves for async attempt", async () => {
		// arrange
		const asyncFunc = async (): Promise<void> => undefined;

		const commands = cmd.ofError(asyncFunc, () => ({
			name: "Error",
		}));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([null]);
	});

	it("resolves for async attempt, fail", async () => {
		// arrange
		const asyncFunc = async (): Promise<void> => {
			throw new Error("error");
		};

		const commands = cmd.ofError(asyncFunc, () => ({
			name: "Error",
		}));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Error" }]);
	});

	it("resolves for async perform", async () => {
		// arrange
		const asyncFunc = async (): Promise<void> => undefined;

		const commands = cmd.ofSuccess(asyncFunc, () => ({ name: "Msg1" }));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Msg1" }]);
	});

	it("does not throw when async perform fails", async () => {
		// arrange
		const asyncFunc = async (): Promise<void> => {
			throw new Error("fail");
		};

		const commands = cmd.ofSuccess(asyncFunc, (): Message => ({ name: "Msg1" }));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([null]);
	});

	it("resolves for attempt", async () => {
		// arrange
		const func = (): void => {
			// blank
		};

		const commands = cmd.ofError(func, () => ({ name: "Error" }));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([null]);
	});

	it("resolves for attempt, fail", async () => {
		// arrange
		const func = (): void => {
			throw new Error("fail");
		};

		const commands = cmd.ofError(func, () => ({ name: "Error" }));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Error" }]);
	});

	it("resolves for sync perform", async () => {
		// arrange
		const func = (): void => {
			// blank
		};

		const commands = cmd.ofSuccess(func, () => ({ name: "Msg1" }));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([{ name: "Msg1" }]);
	});

	it("does not throw if sync perform fails", async () => {
		// arrange
		const func = (): void => {
			throw new Error("fail");
		};

		const commands = cmd.ofSuccess(func, (): Message => ({ name: "Msg1" }));

		// act
		const messages = await execCmd(commands);

		// assert
		expect(messages).toStrictEqual([null]);
	});
});
