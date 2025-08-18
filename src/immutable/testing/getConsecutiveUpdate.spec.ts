import { cmd } from "../../cmd";
import type { InitResult } from "../../Types";
import type { UpdateMap } from "../Types";
import { getConsecutiveUpdateFn } from "./getConsecutiveUpdate";

interface Model {
	value1: string;
	value2: string;
	value3: string;
}

interface Props {}

type Message =
	| { name: "first" }
	| { name: "second" }
	| { name: "third" }
	| { name: "firstWithDefer" }
	| { name: "jumpToThird" }
	| { name: "somethingAsync" };

const Msg = {
	first: (): Message => ({ name: "first" }),
	second: (): Message => ({ name: "second" }),
	third: (): Message => ({ name: "third" }),
	firstWithDefer: (): Message => ({ name: "firstWithDefer" }),
	jumpToThird: (): Message => ({ name: "jumpToThird" }),
	somethingAsync: (): Message => ({ name: "somethingAsync" }),
};

function init(): InitResult<Model, Message> {
	return [
		{
			value1: "",
			value2: "",
			value3: "",
		},
	];
}

const update: UpdateMap<Props, Model, Message> = {
	first(_msg, model) {
		model.value1 = "1";

		return [cmd.ofMsg(Msg.second())];
	},

	second(_msg, model) {
		model.value2 = "2";

		return [cmd.ofMsg(Msg.third())];
	},

	third(_msg, model) {
		model.value3 = "3";

		return [];
	},

	firstWithDefer(_msg, model, _props, { defer }) {
		defer(cmd.ofMsg(Msg.second()));

		model.value1 = "1";

		return [];
	},

	jumpToThird() {
		return [cmd.ofMsg(Msg.third())];
	},

	somethingAsync(_msg, model) {
		model.value1 = "async";

		return [cmd.ofSuccess(doSomething, Msg.third)];
	},
};

async function doSomething(): Promise<void> {
	// does nothing
}

describe("getConsecutiveUpdate", () => {
	const consecutiveUpdate = getConsecutiveUpdateFn(update);

	it("executes all messages and returns the correct end state", async () => {
		// act
		const model = await consecutiveUpdate(Msg.first(), init()[0], {});

		// assert
		expect(model).toStrictEqual<Model>({ value1: "1", value2: "2", value3: "3" });
	});

	it("executes all messages and returns the correct end state including deferred values", async () => {
		// act
		const model = await consecutiveUpdate(Msg.firstWithDefer(), init()[0], {});

		// assert
		expect(model).toStrictEqual<Model>({ value1: "1", value2: "2", value3: "3" });
	});

	it("only returns the partial updated state", async () => {
		// arrange
		const initialModel: Model = { value1: "0", value2: "0", value3: "0" };

		// act
		const model = await consecutiveUpdate(Msg.jumpToThird(), initialModel, {});

		// assert
		expect(model).toStrictEqual<Partial<Model>>({ value3: "3" });
	});

	it("works with async operations", async () => {
		// act
		const model = await consecutiveUpdate(Msg.somethingAsync(), init()[0], {});

		// assert
		expect(model).toStrictEqual<Partial<Model>>({ value1: "async", value3: "3" });
	});
});
