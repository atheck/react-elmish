import { cmd } from "../../cmd";
import type { Nullable } from "../../Types";
import type { UpdateFunction, UpdateMap } from "../Types";
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
});
