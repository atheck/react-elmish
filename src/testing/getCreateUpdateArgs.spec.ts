import { cmd } from "../cmd";
import type { InitResult } from "../Types";
import { getCreateModelAndProps, getCreateUpdateArgs } from "./getCreateUpdateArgs";

interface Message {
	name: "load";
}

interface Model {
	value: string;
	count: number;
}

interface Props {
	initialValue: string;
	step: number;
}

function init(props: Props): InitResult<Model, Message> {
	return [{ value: props.initialValue, count: 0 }, cmd.ofMsg({ name: "load" })];
}

const initProps = (): Props => ({ initialValue: "initial", step: 1 });

describe("getCreateModelAndProps", () => {
	it("creates the model with init and the initial props", () => {
		// arrange
		const createModelAndProps = getCreateModelAndProps(init, initProps);

		// act
		const [model, props] = createModelAndProps();

		// assert
		expect(model).toStrictEqual({ value: "initial", count: 0 });
		expect(props).toStrictEqual({ initialValue: "initial", step: 1 });
	});

	it("passes the overridden props to init and applies the model template", () => {
		// arrange
		const createModelAndProps = getCreateModelAndProps(init, initProps);

		// act
		const [model, props] = createModelAndProps({ count: 5 }, { initialValue: "overridden" });

		// assert
		expect(model).toStrictEqual({ value: "overridden", count: 5 });
		expect(props).toStrictEqual({ initialValue: "overridden", step: 1 });
	});
});

describe("getCreateUpdateArgs", () => {
	it("creates the message, model, props, and options", () => {
		// arrange
		const createUpdateArgs = getCreateUpdateArgs(init, initProps);
		const defer = jest.fn();

		// act
		const args = createUpdateArgs({ name: "load" }, { count: 2 }, { step: 3 }, { defer });

		// assert
		expect(args).toStrictEqual([
			{ name: "load" },
			{ value: "initial", count: 2 },
			{ initialValue: "initial", step: 3 },
			{ defer },
		]);
	});
});
