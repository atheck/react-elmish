import { cmd } from "../../cmd";
import type { InitResult } from "../../Types";
import { getCreateModelAndProps, getCreateUpdateArgs } from "./getCreateUpdateArgs";

interface Message {
	name: "load";
}

interface Model {
	value: string;
	items: string[];
}

interface Props {
	initialValue: string;
}

function init(props: Props): InitResult<Model, Message> {
	return [{ value: props.initialValue, items: [] }, cmd.ofMsg({ name: "load" })];
}

const initProps = (): Props => ({ initialValue: "initial" });

describe("getCreateModelAndProps", () => {
	it("creates a deeply frozen model with the overridden props and the model template", () => {
		// arrange
		const createModelAndProps = getCreateModelAndProps(init, initProps);

		// act
		const [model, props] = createModelAndProps({ items: ["item"] }, { initialValue: "overridden" });

		// assert
		expect(model).toStrictEqual({ value: "overridden", items: ["item"] });
		expect(props).toStrictEqual({ initialValue: "overridden" });
		expect(Object.isFrozen(model)).toBe(true);
		expect(Object.isFrozen(model.items)).toBe(true);
	});
});

describe("getCreateUpdateArgs", () => {
	it("creates the message, a deeply frozen model, props, and options", () => {
		// arrange
		const createUpdateArgs = getCreateUpdateArgs(init, initProps);

		// act
		const [msg, model, props, options] = createUpdateArgs({ name: "load" }, { value: "changed" });

		// assert
		expect(msg).toStrictEqual({ name: "load" });
		expect(model).toStrictEqual({ value: "changed", items: [] });
		expect(Object.isFrozen(model)).toBe(true);
		expect(props).toStrictEqual({ initialValue: "initial" });
		expect(options).toBeUndefined();
	});
});
