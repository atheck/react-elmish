import { cmd } from "../cmd";
import type { UpdateMap } from "../Types";
import { getUpdateFn } from "./getUpdateFn";

type Message = { name: "foo" } | { name: "bar" };

interface Model {
	foo: string;
	bar: string;
}

interface Props {}

const baseUpdateMap: UpdateMap<Props, Model, Message> = {
	foo(_msg, _model, _props, { defer }) {
		defer({ bar: "deferred by base" }, cmd.ofMsg({ name: "bar" }));

		return [{ foo: "base" }];
	},
	bar() {
		return [{}];
	},
};

const derivedUpdateMap: UpdateMap<Props, Model, Message> = {
	...baseUpdateMap,
	foo(_msg, _model, _props, { callBase }) {
		return callBase(baseUpdateMap.foo);
	},
};

const initialModel: Model = { foo: "", bar: "" };

describe("getUpdateFn", () => {
	it("applies the deferred changes of a base handler called with callBase", () => {
		// arrange
		const updateFn = getUpdateFn(derivedUpdateMap);

		// act
		const [model, ...commands] = updateFn({ name: "foo" }, initialModel, {});

		// assert
		expect(model).toStrictEqual({ foo: "base", bar: "deferred by base" });
		expect(commands).toHaveLength(1);
	});

	it("passes the defer function of the options template to a base handler called with callBase", () => {
		// arrange
		const mockDefer = jest.fn();
		const updateFn = getUpdateFn(derivedUpdateMap);

		// act
		const [model, ...commands] = updateFn({ name: "foo" }, initialModel, {}, { defer: mockDefer });

		// assert
		expect(mockDefer).toHaveBeenCalledTimes(1);
		expect(mockDefer).toHaveBeenCalledWith({ bar: "deferred by base" }, expect.any(Array));
		expect(model).toStrictEqual({ foo: "base" });
		expect(commands).toStrictEqual([]);
	});
});
