/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { type JSX, type ReactNode, StrictMode } from "react";
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

	it("uses the provided fake dispatch with a function component", () => {
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

	it("uses the provided fake dispatch with a class component", () => {
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

	it("does not pass the fake model to the next render when the render function throws", () => {
		// arrange
		const model: Model = { value: "It works" };

		expect(() =>
			renderWithModel(() => {
				throw new Error("render failed");
			}, model),
		).toThrow("render failed");

		// act
		render(<TestComponent />);

		// assert
		expect(screen.queryByText("It works")).not.toBeInTheDocument();
	});

	it("does not pass the fake model to an already mounted component re-rendering", () => {
		// arrange
		const model: Model = { value: "It works" };
		const api = render(<TwoComponents showSecond={false} />);

		// act
		renderWithModel(() => api.rerender(<TwoComponents showSecond />), model);

		// assert
		expect(within(screen.getByRole("region", { name: "second" })).getByRole("paragraph")).toHaveTextContent("It works");
		expect(within(screen.getByRole("region", { name: "first" })).getByRole("paragraph")).toBeEmptyDOMElement();
	});

	it("passes the fake model only to the first initialized component, not to its children", () => {
		// arrange
		const model: ParentModel = { title: "Fake title" };

		// act
		renderWithModel(() => render(<ParentComponent />), model);

		// assert
		expect(screen.getByText("Fake title")).toBeInTheDocument();
		expect(within(screen.getByRole("region", { name: "child" })).getByRole("paragraph")).toBeEmptyDOMElement();
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

	it("keeps the fake model until the promise returned by the render function resolves", async () => {
		// arrange
		const model: Model = { value: "It works" };
		const { promise, resolve } = Promise.withResolvers<void>();
		const result = renderWithModel(async () => {
			await promise;
		}, model);

		// act
		render(<TestComponent />);
		resolve();
		await result;
		await Promise.resolve();
		render(<TestComponent />);

		// assert
		expect(screen.getAllByRole("paragraph").map((element) => element.textContent)).toStrictEqual(["It works", ""]);
	});

	it("resets the fake model when the promise returned by the render function rejects", async () => {
		// arrange
		const model: Model = { value: "It works" };
		const { promise, reject } = Promise.withResolvers<void>();
		const result = renderWithModel(async () => {
			await promise;
		}, model);

		// act
		reject(new Error("render failed"));
		await expect(result).rejects.toThrow("render failed");
		await Promise.resolve();
		render(<TestComponent />);

		// assert
		expect(screen.queryByText("It works")).not.toBeInTheDocument();
	});
});

function TwoComponents({ showSecond }: { showSecond: boolean }): JSX.Element {
	return (
		<>
			<section aria-label={"first"}>
				<TestComponent />
			</section>
			{showSecond ? (
				<section aria-label={"second"}>
					<TestComponent />
				</section>
			) : null}
		</>
	);
}

interface ParentModel {
	title: string;
}

function ParentComponent(): JSX.Element {
	const [{ title }] = useElmish<Props, ParentModel, Message>({
		name: "ParentComponent",
		props: {},
		init: () => [{ title: "Real title" }],
		update: () => [{}],
	});

	return (
		<div>
			<h1>{title}</h1>
			<section aria-label={"child"}>
				<TestComponent />
			</section>
		</div>
	);
}
