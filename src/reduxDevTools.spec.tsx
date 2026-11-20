import { act, render } from "@testing-library/react";
import type { JSX } from "react";
import { init as initElmish } from "./Init";
import { useElmish as useImmutableElmish } from "./immutable";
import type { ReduxDevTools, ReduxDevToolsExtension } from "./reduxDevTools";
import type { Dispatch, InitResult } from "./Types";
import { useElmish } from "./useElmish";

interface Message {
	name: "increment";
}

interface Model {
	value: number;
}

interface ReduxMessageCallbackHolder {
	callback?: Parameters<ReduxDevTools["subscribe"]>[0];
}

let componentModel: Model | undefined;
let componentDispatch: Dispatch<Message> | undefined;

function init(): InitResult<Model, Message> {
	return [{ value: 0 }];
}

function MutableComponent(): JSX.Element {
	const [model, dispatch] = useElmish<object, Model, Message>({
		name: "MutableComponent",
		props: {},
		init,
		update: (model) => [{ value: model.value + 1 }],
	});

	/* eslint-disable react/globals, unicorn/no-top-level-assignment-in-function -- Test only. */
	// biome-ignore lint/nursery/useReactCompiler: Test only.
	componentModel = model;
	// biome-ignore lint/nursery/useReactCompiler: Test only.
	componentDispatch = dispatch;
	/* eslint-enable react/globals, unicorn/no-top-level-assignment-in-function */

	return <div />;
}

function ImmutableComponent(): JSX.Element {
	const [model, dispatch] = useImmutableElmish<object, Model, Message>({
		name: "ImmutableComponent",
		props: {},
		init,
		update(model) {
			model.value++;

			return [];
		},
	});

	/* eslint-disable react/globals, unicorn/no-top-level-assignment-in-function -- Test only. */
	// biome-ignore lint/nursery/useReactCompiler: Test only.
	componentModel = model;
	// biome-ignore lint/nursery/useReactCompiler: Test only.
	componentDispatch = dispatch;
	/* eslint-enable react/globals, unicorn/no-top-level-assignment-in-function */

	return <div />;
}

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
])("Redux DevTools with %s", (_name, Component) => {
	let devTools: jest.Mocked<ReduxDevTools>;
	let subscription: ReduxMessageCallbackHolder;

	beforeEach(() => {
		subscription = {};
		devTools = {
			init: jest.fn(),
			send: jest.fn(),
			subscribe: jest.fn((callback) => {
				subscription.callback = callback;

				return jest.fn();
			}),
			unsubscribe: jest.fn(),
		};

		const extension: ReduxDevToolsExtension = {
			connect: jest.fn(() => devTools),
			disconnect: jest.fn(),
		};

		Object.defineProperty(window, "__REDUX_DEVTOOLS_EXTENSION__", { value: extension, configurable: true });
		initElmish({ enableDevTools: true });
	});

	afterEach(() => {
		Reflect.deleteProperty(window, "__REDUX_DEVTOOLS_EXTENSION__");
		initElmish({});
	});

	it("sends the initial model to the DevTools on mount", () => {
		// act
		render(<Component />);

		// assert
		expect(devTools.init).toHaveBeenCalledWith({ value: 0 });
	});

	it("continues with the model the DevTools jumped to", () => {
		// arrange
		render(<Component />);

		act(() => componentDispatch?.({ name: "increment" }));
		act(() => componentDispatch?.({ name: "increment" }));

		act(() =>
			subscription.callback?.({
				type: "DISPATCH",
				payload: { type: "JUMP_TO_ACTION" },
				state: JSON.stringify({ value: 0 }),
			}),
		);

		expect(componentModel).toStrictEqual({ value: 0 });

		// act
		act(() => componentDispatch?.({ name: "increment" }));

		// assert
		expect(componentModel).toStrictEqual({ value: 1 });
	});
});
