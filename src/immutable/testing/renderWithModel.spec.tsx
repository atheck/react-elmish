import { render, screen } from "@testing-library/react";
import { type JSX, type ReactNode, StrictMode } from "react";
import type { InitResult } from "../../Types";
import { ElmComponent } from "../ElmComponent";
import type { UpdateReturnType } from "../Types";
import { useElmish } from "../useElmish";
import { renderWithModel } from ".";

interface Message {
	name: "click";
}

interface Model {
	value: string;
}

interface Props {}

function init(): InitResult<Model, Message> {
	return [{ value: "" }];
}

function update(): UpdateReturnType<Message> {
	return [];
}

function TestComponent(): JSX.Element {
	const [{ value }] = useElmish({
		name: "TestComponent",
		props: {},
		init,
		update,
	});

	return <p>{value}</p>;
}

class TestClassComponent extends ElmComponent<Model, Message, Props> {
	public constructor(props: Props) {
		super(props, init, "TestClassComponent");
	}

	public update = update;

	public override render(): ReactNode {
		const { value } = this.model;

		return <p>{value}</p>;
	}
}

describe("renderWithModel with the immutable variant", () => {
	it("renders function component with provided model", () => {
		// arrange
		const model: Model = { value: "It works" };

		// act
		renderWithModel(() => render(<TestComponent />), model);

		// assert
		expect(screen.getByText("It works")).toBeInTheDocument();
	});

	it("renders function component with provided model in StrictMode", () => {
		// arrange
		const model: Model = { value: "It works" };

		// act
		renderWithModel(
			() =>
				render(
					<StrictMode>
						<TestComponent />
					</StrictMode>,
				),
			model,
		);

		// assert
		expect(screen.getByText("It works")).toBeInTheDocument();
	});

	it("renders class component with provided model in StrictMode", () => {
		// arrange
		const model: Model = { value: "It works" };

		// act
		renderWithModel(
			() =>
				render(
					<StrictMode>
						<TestClassComponent />
					</StrictMode>,
				),
			model,
		);

		// assert
		expect(screen.getByText("It works")).toBeInTheDocument();
	});
});
