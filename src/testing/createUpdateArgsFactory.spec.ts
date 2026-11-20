import { createUpdateArgsFactory } from "./createUpdateArgsFactory";

interface Message {
	name: "foo";
}

interface Model {
	foo: string;
	bar: number;
}

interface Props {
	baz: boolean;
	qux: string;
}

describe("createUpdateArgsFactory", () => {
	const createUpdateArgs = createUpdateArgsFactory<Props, Model, Message>(
		() => ({ foo: "initial", bar: 1 }),
		() => ({ baz: false, qux: "initial" }),
	);

	it("creates the update arguments from the initial model and props", () => {
		// act
		const [msg, model, props, options] = createUpdateArgs({ name: "foo" });

		// assert
		expect(msg).toStrictEqual({ name: "foo" });
		expect(model).toStrictEqual({ foo: "initial", bar: 1 });
		expect(props).toStrictEqual({ baz: false, qux: "initial" });
		expect(options).toBeUndefined();
	});

	it("overrides the initial model and props with the templates and passes the options", () => {
		// arrange
		const optionsTemplate = { defer: jest.fn() };

		// act
		const [, model, props, options] = createUpdateArgs({ name: "foo" }, { bar: 2 }, { qux: "changed" }, optionsTemplate);

		// assert
		expect(model).toStrictEqual({ foo: "initial", bar: 2 });
		expect(props).toStrictEqual({ baz: false, qux: "changed" });
		expect(options).toBe(optionsTemplate);
	});

	it("creates a new model and props for each call", () => {
		// act
		const [, model1, props1] = createUpdateArgs({ name: "foo" });
		const [, model2, props2] = createUpdateArgs({ name: "foo" });

		// assert
		expect(model1).not.toBe(model2);
		expect(props1).not.toBe(props2);
	});
});
