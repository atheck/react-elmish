import { cmd } from "../../cmd";
import type { Nullable } from "../../Types";
import type { UpdateFunction, UpdateMap } from "../Types";
import { getConsecutiveUpdateFn } from "./getConsecutiveUpdate";
import { getUpdateAndExecCmdFn, getUpdateFn } from "./getUpdateFn";

type Message = { name: "foo" } | { name: "bar" } | { name: "foobar" };

interface Model {
	foo: string;
	bar: Nullable<{
		foo: string;
		bar: number;
	}>;
	foobar: string[];
}

interface Props {}

const updateMap: UpdateMap<Props, Model, Message> = {
	foo(_msg, model) {
		model.foo = "bar";

		return [];
	},
	bar(_msg, model) {
		model.bar = { foo: "bar", bar: 1 };

		return [];
	},
	foobar(_msg, model) {
		model.foobar.push("bar");

		return [];
	},
};

const initialModel: Model = { foo: "initial", bar: null, foobar: [] };

describe("getUpdateFn", () => {
	describe("getUpdateFn", () => {
		it("should update the model correctly with simple type update", () => {
			const updateFn = getUpdateFn(updateMap);

			const [updatedModel] = updateFn({ name: "foo" }, { ...initialModel }, {});

			expect(updatedModel).toStrictEqual({ foo: "bar" });
		});

		it("should update the model correctly with complex type update replacing null", () => {
			const updateFn = getUpdateFn(updateMap);

			const [updatedModel] = updateFn({ name: "bar" }, { ...initialModel }, {});

			expect(updatedModel).toStrictEqual({ bar: { foo: "bar", bar: 1 } });
		});

		it("should update the model correctly with complex type update replacing an existing object", () => {
			const localInitialModel: Model = { ...initialModel, bar: { foo: "", bar: 1 } };
			const updateFn = getUpdateFn(updateMap);

			const [updatedModel] = updateFn({ name: "bar" }, localInitialModel, {});

			expect(updatedModel).toStrictEqual({ bar: { foo: "bar", bar: 1 } });
		});

		it("should update the model correctly with an update of an array", () => {
			const updateFn = getUpdateFn(updateMap);

			const [updatedModel] = updateFn({ name: "foobar" }, { ...initialModel }, {});

			expect(updatedModel).toStrictEqual({ foobar: ["bar"] });
		});
	});

	describe("update function", () => {
		const update: UpdateFunction<Props, Model, Message> = (model, msg) => {
			switch (msg.name) {
				case "foo":
					model.foo = "bar";

					return [];
				case "bar":
					model.bar = { foo: "bar", bar: 1 };

					return [];
				case "foobar":
					model.foobar.push("bar");

					return [cmd.ofMsg({ name: "foo" })];
			}
		};

		it("computes the diff from an update function", () => {
			const updateFn = getUpdateFn(update);

			const [updatedModel] = updateFn({ name: "bar" }, { ...initialModel }, {});

			expect(updatedModel).toStrictEqual({ bar: { foo: "bar", bar: 1 } });
		});

		it("computes the diff for an in-place array update from an update function", () => {
			const updateFn = getUpdateFn(update);

			const [updatedModel] = updateFn({ name: "foobar" }, { ...initialModel }, {});

			expect(updatedModel).toStrictEqual({ foobar: ["bar"] });
		});

		it("returns the commands from an update function", () => {
			const updateFn = getUpdateFn(update);

			const [, ...commands] = updateFn({ name: "foobar" }, { ...initialModel }, {});

			expect(commands).toHaveLength(1);
		});

		it("executes the commands with getUpdateAndExecCmdFn", async () => {
			const updateAndExecCmd = getUpdateAndExecCmdFn(update);

			const [updatedModel, messages] = await updateAndExecCmd({ name: "foobar" }, { ...initialModel }, {});

			expect(updatedModel).toStrictEqual({ foobar: ["bar"] });
			expect(messages).toStrictEqual([{ name: "foo" }]);
		});
	});

	describe("callBase", () => {
		const derivedUpdateMap: UpdateMap<Props, Model, Message> = {
			...updateMap,
			foobar(_msg, model, _props, { defer, callBase }) {
				model.foo = "derived";
				defer(...callBase(updateMap.foobar));

				return [];
			},
		};

		it("includes the model changes of the base handler in the diff", () => {
			const updateFn = getUpdateFn(derivedUpdateMap);

			const [updatedModel] = updateFn({ name: "foobar" }, { ...initialModel }, {});

			expect(updatedModel).toStrictEqual({ foo: "derived", foobar: ["bar"] });
		});

		it("executes the deferred commands of the base handler with getUpdateAndExecCmdFn", async () => {
			const baseUpdateMap: UpdateMap<Props, Model, Message> = {
				...updateMap,
				foobar(_msg, model) {
					model.foobar.push("bar");

					return [cmd.ofMsg({ name: "foo" })];
				},
			};
			const updateAndExecCmd = getUpdateAndExecCmdFn<Props, Model, Message>({
				...baseUpdateMap,
				foobar(_msg, _model, _props, { defer, callBase }) {
					defer(...callBase(baseUpdateMap.foobar));

					return [];
				},
			});

			const [updatedModel, messages] = await updateAndExecCmd({ name: "foobar" }, { ...initialModel }, {});

			expect(updatedModel).toStrictEqual({ foobar: ["bar"] });
			expect(messages).toStrictEqual([{ name: "foo" }]);
		});

		it("passes the defer function of the options template to the base handler", () => {
			// arrange
			const mockDefer = jest.fn();
			const baseUpdateMap: UpdateMap<Props, Model, Message> = {
				...updateMap,
				foobar(_msg, _model, _props, { defer }) {
					defer(cmd.ofMsg({ name: "foo" }));

					return [];
				},
			};
			const updateFn = getUpdateFn<Props, Model, Message>({
				...baseUpdateMap,
				foobar(_msg, _model, _props, { callBase }) {
					return callBase(baseUpdateMap.foobar);
				},
			});

			// act
			const [, ...commands] = updateFn({ name: "foobar" }, { ...initialModel }, {}, { defer: mockDefer });

			// assert
			expect(mockDefer).toHaveBeenCalledTimes(1);
			expect(commands).toStrictEqual([]);
		});
	});

	describe("removed properties", () => {
		type RemoveMessage = { name: "removeSelection" } | { name: "removeNested" } | { name: "checkSelection" };

		interface RemoveModel {
			selection?: string;
			nested: { value?: string; other: number };
			hasSelection?: boolean;
		}

		const removeUpdateMap: UpdateMap<Props, RemoveModel, RemoveMessage> = {
			removeSelection(_msg, model) {
				// biome-ignore lint/performance/noDelete: We test the removal of a property.
				delete model.selection;

				return [cmd.ofMsg({ name: "checkSelection" })];
			},
			removeNested(_msg, model) {
				// biome-ignore lint/performance/noDelete: We test the removal of a property.
				delete model.nested.value;

				return [];
			},
			checkSelection(_msg, model) {
				model.hasSelection = "selection" in model;

				return [];
			},
		};

		const createModel = (): RemoveModel => ({ selection: "selected", nested: { value: "value", other: 1 } });

		it("includes a removed property with the value undefined", () => {
			const updateFn = getUpdateFn(removeUpdateMap);

			const [updatedModel] = updateFn({ name: "removeSelection" }, createModel(), {});

			expect(updatedModel).toStrictEqual({ selection: undefined });
			expect(updatedModel).toHaveProperty("selection");
		});

		it("includes the whole top level property when a nested property is removed", () => {
			const updateFn = getUpdateFn(removeUpdateMap);

			const [updatedModel] = updateFn({ name: "removeNested" }, createModel(), {});

			expect(updatedModel).toStrictEqual({ nested: { other: 1 } });
		});

		it("passes the removal of a property to the consecutive updates", async () => {
			const consecutiveUpdate = getConsecutiveUpdateFn(removeUpdateMap);

			const updatedModel = await consecutiveUpdate({ name: "removeSelection" }, createModel(), {});

			expect(updatedModel).toStrictEqual({ selection: undefined, hasSelection: false });
		});
	});
});
