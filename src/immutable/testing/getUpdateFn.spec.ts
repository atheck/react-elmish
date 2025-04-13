import type { UpdateMap } from "../Types";
import { getUpdateFn } from "./getUpdateFn";

type Message = { name: "foo" } | { name: "bar" };

interface Model {
	foo: string;
	bar: {
		foo: string;
		bar: number;
	} | null;
}

interface Props {}

const updateMap: UpdateMap<Props, Model, Message> = {
	foo() {
		return [
			(draft) => {
				draft.foo = "bar";
			},
		];
	},
	bar() {
		return [
			(draft) => {
				draft.bar = { foo: "bar", bar: 1 };
			},
		];
	},
};

describe("getUpdateFn", () => {
	describe("getUpdateFn", () => {
		it("should update the model correctly with simple type update", () => {
			const initialModel: Model = { foo: "initial", bar: null };
			const updateFn = getUpdateFn(updateMap);

			const [updatedModel] = updateFn({ name: "foo" }, initialModel, {});

			expect(updatedModel).toStrictEqual({ foo: "bar" });
		});

		it("should update the model correctly with complex type update replacing null", () => {
			const initialModel: Model = { foo: "initial", bar: null };
			const updateFn = getUpdateFn(updateMap);

			const [updatedModel] = updateFn({ name: "bar" }, initialModel, {});

			expect(updatedModel).toStrictEqual({ bar: { foo: "bar", bar: 1 } });
		});

		it("should update the model correctly with complex type update replacing an existing object", () => {
			const initialModel: Model = { foo: "initial", bar: { foo: "", bar: 1 } };
			const updateFn = getUpdateFn(updateMap);

			const [updatedModel] = updateFn({ name: "bar" }, initialModel, {});

			expect(updatedModel).toStrictEqual({ bar: { foo: "bar", bar: 1 } });
		});
	});
});
