import { fireEvent, render, screen } from "@testing-library/react";
import type { JSX } from "react";
import { useElmish as useImmutableElmish } from "./immutable";
import type { Dispatch } from "./Types";
import { useElmish } from "./useElmish";

interface Message {
	name: "change";
}

interface Model {
	value: string;
}

interface Props {
	newValue: string;
	onDispatch: (dispatch: Dispatch<Message>) => void;
}

function MutableComponent(props: Props): JSX.Element {
	const { newValue, onDispatch } = props;
	const [{ value }, dispatch] = useElmish<Props, Model, Message>({
		name: "MutableComponent",
		props,
		init: () => [{ value: "initial" }],
		// A new update map with each render, which uses the current value.
		update: {
			change: () => [{ value: newValue }],
		},
	});

	onDispatch(dispatch);

	return (
		<button onClick={() => dispatch({ name: "change" })} type={"button"}>
			{value}
		</button>
	);
}

function ImmutableComponent(props: Props): JSX.Element {
	const { newValue, onDispatch } = props;
	const [{ value }, dispatch] = useImmutableElmish<Props, Model, Message>({
		name: "ImmutableComponent",
		props,
		init: () => [{ value: "initial" }],
		// A new update map with each render, which uses the current value.
		update: {
			change(_msg, model) {
				model.value = newValue;

				return [];
			},
		},
	});

	onDispatch(dispatch);

	return (
		<button onClick={() => dispatch({ name: "change" })} type={"button"}>
			{value}
		</button>
	);
}

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
])("%s", (_name, Component) => {
	it("uses the update passed with the latest render", () => {
		// arrange
		const onDispatch = jest.fn();
		const api = render(<Component newValue={"first"} onDispatch={onDispatch} />);

		api.rerender(<Component newValue={"second"} onDispatch={onDispatch} />);

		// act
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not installed.
		fireEvent.click(screen.getByRole("button"));

		// assert
		expect(screen.getByRole("button")).toHaveTextContent("second");
	});

	it("returns the same dispatch function with each render", () => {
		// arrange
		const onDispatch = jest.fn();
		const api = render(<Component newValue={"first"} onDispatch={onDispatch} />);

		// act
		api.rerender(<Component newValue={"second"} onDispatch={onDispatch} />);

		// assert
		const dispatches = new Set(onDispatch.mock.calls.map(([dispatch]: [Dispatch<Message>]) => dispatch));

		expect(dispatches.size).toBe(1);
	});
});
