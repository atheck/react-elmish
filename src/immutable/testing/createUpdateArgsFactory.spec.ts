import { createUpdateArgsFactory } from "./createUpdateArgsFactory";

interface Message {
	name: "foo";
}

interface Model {
	foo: string;
	nested: { bar: number };
}

interface Props {
	baz: boolean;
}

describe("immutable createUpdateArgsFactory", () => {
	const createUpdateArgs = createUpdateArgsFactory<Props, Model, Message>(
		() => ({ foo: "initial", nested: { bar: 1 } }),
		() => ({ baz: false }),
	);

	it("overrides the initial model and props with the templates and passes the options", () => {
		// arrange
		const optionsTemplate = { defer: jest.fn() };

		// act
		const [msg, model, props, options] = createUpdateArgs({ name: "foo" }, { foo: "changed" }, { baz: true }, optionsTemplate);

		// assert
		expect(msg).toStrictEqual({ name: "foo" });
		expect(model).toStrictEqual({ foo: "changed", nested: { bar: 1 } });
		expect(props).toStrictEqual({ baz: true });
		expect(options).toBe(optionsTemplate);
	});

	it("deeply freezes the model", () => {
		// act
		const [, model] = createUpdateArgs({ name: "foo" });

		// assert
		expect(Object.isFrozen(model)).toBe(true);
		expect(Object.isFrozen(model.nested)).toBe(true);
	});
});
