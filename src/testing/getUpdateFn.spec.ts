import { cmd } from "../cmd";
import type { UpdateMap } from "../Types";
import { getUpdateAndExecCmdFn, getUpdateFn } from "./getUpdateFn";

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

	it("uses the created defer and callBase functions, if the options template sets them to undefined", () => {
		// arrange
		const updateFn = getUpdateFn(derivedUpdateMap);

		// act
		const [model, ...commands] = updateFn({ name: "foo" }, initialModel, {}, { defer: undefined, callBase: undefined });

		// assert
		expect(model).toStrictEqual({ foo: "base", bar: "deferred by base" });
		expect(commands).toHaveLength(1);
	});

	it("does not modify the passed model, like at runtime", () => {
		// arrange
		const model: Model = { foo: "", bar: "" };
		const updateFn = getUpdateFn<Props, Model, Message>({
			...baseUpdateMap,
			bar(_msg, currentModel) {
				currentModel.bar = "modified";

				return [{}];
			},
		});

		// act
		const [updatedModel] = updateFn({ name: "bar" }, model, {});

		// assert
		expect(updatedModel).toStrictEqual({});
		expect(model).toStrictEqual({ foo: "", bar: "" });
	});
});

describe("getUpdateAndExecCmdFn", () => {
	it("returns the model changes and the messages of the executed commands, including the deferred ones", async () => {
		// arrange
		const updateAndExecCmdFn = getUpdateAndExecCmdFn<Props, Model, Message>({
			...baseUpdateMap,
			foo(_msg, _model, _props, { defer }) {
				defer({ bar: "deferred" }, cmd.ofMsg({ name: "bar" }));

				return [
					{ foo: "updated" },
					cmd.ofSuccess(
						async () => "result",
						() => ({ name: "foo" }),
					),
				];
			},
		});

		// act
		const [model, messages] = await updateAndExecCmdFn({ name: "foo" }, initialModel, {});

		// assert
		expect(model).toStrictEqual({ foo: "updated", bar: "deferred" });
		expect(messages).toStrictEqual([{ name: "foo" }, { name: "bar" }]);
	});

	it("returns an empty array of messages if there are no commands", async () => {
		// arrange
		const updateAndExecCmdFn = getUpdateAndExecCmdFn(baseUpdateMap);

		// act
		const [model, messages] = await updateAndExecCmdFn({ name: "bar" }, initialModel, {});

		// assert
		expect(model).toStrictEqual({});
		expect(messages).toStrictEqual([]);
	});
});
