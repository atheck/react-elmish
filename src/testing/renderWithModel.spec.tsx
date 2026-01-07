/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from "@testing-library/react";
import type { JSX, ReactNode } from "react";
import { ElmComponent, useElmish } from "..";
import type { InitResult, UpdateReturnType } from "../Types";
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

function update(): UpdateReturnType<Model, Message> {
	return [{}];
}

function TestComponent(): JSX.Element {
	const [{ value }, dispatch] = useElmish({
		name: "TestComponent",
		props: {},
		init,
		update,
	});

	return (
		<div>
			<p>{value}</p>
			<button type={"button"} onClick={() => dispatch({ name: "click" })}>
				{"Click"}
			</button>
		</div>
	);
}

class TestClassComponent extends ElmComponent<Model, Message, Props> {
	public constructor(props: Props) {
		super(props, init, "TestClassComponent");
	}

	public update = update;

	public override render(): ReactNode {
		const { value } = this.model;

		return (
			<div>
				<p>{value}</p>
				<button type={"button"} onClick={() => this.dispatch({ name: "click" })}>
					{"Click"}
				</button>
			</div>
		);
	}
}

describe("renderWithModel", () => {
	it("renders function component with provided model", () => {
		// arrange
		const model: Model = { value: "It works" };

		// act
		renderWithModel(() => render(<TestComponent />), model);

		// assert
		expect(screen.getByText("It works")).toBeInTheDocument();
	});

	it("uses the provided fake dispatch with a function component", async () => {
		// arrange
		const model: Model = { value: "" };
		const mockDispatch = jest.fn();

		renderWithModel(() => render(<TestComponent />), model, {
			dispatch: mockDispatch,
		});

		// act
		fireEvent.click(screen.getByText("Click"));

		// assert
		expect(mockDispatch).toHaveBeenCalledWith({ name: "click" });
	});

	it("renders class component with provided model", () => {
		// arrange
		const model: Model = { value: "It works" };

		// act
		renderWithModel(() => render(<TestClassComponent />), model);

		// assert
		expect(screen.getByText("It works")).toBeInTheDocument();
	});

	it("uses the provided fake dispatch with a class component", async () => {
		// arrange
		const model: Model = { value: "" };
		const mockDispatch = jest.fn();

		renderWithModel(() => render(<TestClassComponent />), model, {
			dispatch: mockDispatch,
		});

		// act
		fireEvent.click(screen.getByText("Click"));

		// assert
		expect(mockDispatch).toHaveBeenCalledWith({ name: "click" });
	});
});
