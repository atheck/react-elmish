import type { UpdateMap } from "../Types";
import { getUpdateFn } from "./getUpdateFn";

type Message = { name: "foo" } | { name: "bar" } | { name: "foobar" };

interface Model {
	foo: string;
	bar: {
		foo: string;
		bar: number;
	} | null;
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
});
