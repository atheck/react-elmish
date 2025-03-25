import { cmd } from "./cmd";
import type { UpdateMap } from "./Types";

type Message1 = { name: "test"; param: string } | { name: "second" };
type Message2 = { name: "first" } | Message1;

interface Model {}

interface Props {}

const updateMap1: UpdateMap<Props, Model, Message1> = {
	test() {
		return [{}, cmd.ofMsg({ name: "second" })];
	},

	second() {
		return [{}];
	},
};

const updateMap2: UpdateMap<Props, Model, Message2> = {
	first() {
		return [{}];
	},

	...updateMap1,

	test(_msg, _model, _props, { defer, callBase }) {
		defer(...callBase(updateMap1.test));
		defer({}, cmd.ofMsg({ name: "first" }));

		return [{}];
	},
};

describe("createCallBase", () => {
	it("works", () => {
		// arrange
		const mockDefer = jest.fn();
		const mockCallBase = jest.fn().mockReturnValue([{ foo: "bar" }, { name: "second" }]);

		// act
		updateMap2.test({ name: "test", param: "test" }, {}, {}, { defer: mockDefer, callBase: mockCallBase });

		// assert
		expect(mockCallBase).toHaveBeenCalledWith(updateMap1.test);
		expect(mockDefer).toHaveBeenCalledWith({ foo: "bar" }, { name: "second" });
	});
});
