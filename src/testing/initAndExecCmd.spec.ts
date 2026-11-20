import { cmd } from "../cmd";
import type { InitResult } from "../Types";
import { initAndExecCmd } from "./initAndExecCmd";

interface Model {
	value: string;
}

describe("initAndExecCmd", () => {
	type Message = { name: "loaded"; value: string } | { name: "failed" };

	it("returns the model and no messages without commands", async () => {
		// arrange
		const init = (): InitResult<Model, Message> => [{ value: "initial" }];

		// act
		const [model, messages] = await initAndExecCmd(init);

		// assert
		expect(model).toStrictEqual({ value: "initial" });
		expect(messages).toStrictEqual([]);
	});

	it("passes the arguments to the init function and returns the messages of all commands", async () => {
		// arrange
		const init = (value: string): InitResult<Model, Message> => [
			{ value },
			cmd.ofMsg({ name: "loaded", value: "sync" }),
			cmd.ofEither(
				async () => value.toUpperCase(),
				(result): Message => ({ name: "loaded", value: result }),
				(): Message => ({ name: "failed" }),
			),
		];

		// act
		const [model, messages] = await initAndExecCmd(init, "initial");

		// assert
		expect(model).toStrictEqual({ value: "initial" });
		expect(messages).toStrictEqual([
			{ name: "loaded", value: "sync" },
			{ name: "loaded", value: "INITIAL" },
		]);
	});
});
