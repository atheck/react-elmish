import { render, type RenderResult } from "@testing-library/react";
import type { JSX } from "react";
import { cmd } from "../../cmd";
import { errorMsg, type ErrorMessage } from "../../ErrorHandling";
import { renderWithModel } from "../../testing";
import type { InitResult } from "../../Types";
import { errorHandler } from "../ErrorHandling";
import type { UpdateMap } from "../Types";
import { useElmish } from "../useElmish";
import { getCreateUpdateArgs } from "./getCreateUpdateArgs";
import { getUpdateFn } from "./getUpdateFn";

interface Model {
	value1: string;
	value2: string;
	subPage: string;
}

interface Props {}

type Message = { name: "doubleDefer" } | { name: "first" } | { name: "second" } | { name: "third" } | ErrorMessage;

const Msg = {
	doubleDefer: (): Message => ({ name: "doubleDefer" }),
	first: (): Message => ({ name: "first" }),
	second: (): Message => ({ name: "second" }),
	third: (): Message => ({ name: "third" }),
	...errorMsg,
};

function init(): InitResult<Model, Message> {
	return [
		{
			value1: "",
			value2: "",
			subPage: "",
		},
	];
}

const update: UpdateMap<Props, Model, Message> = {
	doubleDefer(_msg, model, _props, { defer }) {
		defer(cmd.ofMsg(Msg.first()));
		defer(cmd.ofMsg(Msg.second()));

		model.value1 = "computed";

		return [cmd.ofMsg(Msg.third())];
	},

	first() {
		return [];
	},

	second() {
		return [];
	},

	third() {
		return [];
	},

	...errorHandler(),
};

function Playground(props: Props): JSX.Element {
	const [, dispatch] = useElmish({ name: "Playground", init, update, props });

	return (
		<div>
			<button type={"button"} onClick={() => dispatch(Msg.doubleDefer())}>
				{"Compute"}
			</button>
		</div>
	);
}

function renderPlayground(modelTemplate?: Partial<Model>): RenderResult {
	const model = {
		...init()[0],
		...modelTemplate,
	};

	return renderWithModel(() => render(<Playground />), model);
}

const getUpdateArgs = getCreateUpdateArgs(init, () => ({}));
const updateFn = getUpdateFn(update);

describe("Playground", () => {
	it("renders without crashing", () => {
		const { container } = renderPlayground();

		expect(container).toBeTruthy();
	});

	describe("doubleDefer", () => {
		it("computes the values", async () => {
			const args = getUpdateArgs(Msg.doubleDefer());

			const [model, ...commands] = updateFn(...args);

			expect(model).toStrictEqual({ value1: "computed" });
			expect(commands).toHaveLength(3);
		});
	});
});
