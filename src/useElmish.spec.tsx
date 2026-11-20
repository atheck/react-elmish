import { act, type RenderResult, render } from "@testing-library/react";
import type { JSX } from "react";
import { type Cmd, cmd, type InitResult, type SubscriptionResult, type UpdateReturnType, useElmish } from ".";
import type { UpdateFunctionOptions } from "./Types";

type Message = { name: "Test" } | { name: "First" } | { name: "Second" } | { name: "Third" } | { name: "Defer" };

interface Model {
	value1: string;
	value2: string;
}

interface Props {
	init: () => InitResult<Model, Message>;
	update: (
		model: Model,
		msg: Message,
		props: Props,
		options: UpdateFunctionOptions<Props, Model, Message>,
	) => UpdateReturnType<Model, Message>;
	subscription?: (model: Model) => SubscriptionResult<Message>;
	dispose?: (model: Model) => void;
	reInitOn?: unknown[];
}

function defaultInit(msg?: Cmd<Message>): InitResult<Model, Message> {
	return [
		{
			value1: "",
			value2: "",
		},
		msg,
	];
}

function defaultUpdate(
	_model: Model,
	msg: Message,
	_props: Props,
	{ defer }: UpdateFunctionOptions<Props, Model, Message>,
): UpdateReturnType<Model, Message> {
	switch (msg.name) {
		case "Test":
			return [{}];

		case "First":
			return [{ value1: "First" }, cmd.ofMsg({ name: "Second" })];

		case "Second":
			return [{ value2: "Second" }];

		case "Third":
			return [{ value2: "Third" }];

		case "Defer": {
			defer({ value2: "Defer" }, cmd.ofMsg({ name: "Third" }));

			return [{ value1: "Defer" }, cmd.ofMsg({ name: "Second" })];
		}
	}
}

let componentModel: Model | undefined;
let componentDispatch: ((msg: Message) => void) | undefined;

describe("useElmish", () => {
	it("calls the init function", () => {
		// arrange
		const init = jest.fn().mockReturnValue([{}, []]);
		const update = jest.fn();
		const props: Props = {
			init,
			update,
		};

		// act
		renderComponent(props);

		// assert
		expect(init).toHaveBeenCalledTimes(1);
		expect(init).toHaveBeenCalledWith(props);
	});

	it("calls the initial command", () => {
		// arrange
		const message: Message = { name: "Test" };
		const init = jest.fn().mockReturnValue([{}, cmd.ofMsg(message)]);
		const update = jest.fn((): UpdateReturnType<Model, Message> => [{}]);
		const props: Props = {
			init,
			update,
		};

		// act
		renderComponent(props);

		// assert
		expect(update).toHaveBeenCalledWith({}, message, props, expect.anything());
	});

	it("updates the model correctly with multiple commands in a row", () => {
		// arrange
		const message: Message = { name: "First" };
		const props: Props = {
			init: () => defaultInit(cmd.ofMsg(message)),
			update: defaultUpdate,
		};

		// act
		renderComponent(props);

		// assert
		expect(componentModel).toStrictEqual({ value1: "First", value2: "Second" });
	});

	it("updates the model correctly with a call to defer", () => {
		// arrange
		const message: Message = { name: "Defer" };
		const props: Props = {
			init: () => defaultInit(cmd.ofMsg(message)),
			update: defaultUpdate,
		};

		// act
		renderComponent(props);

		// assert
		expect(componentModel).toStrictEqual({ value1: "Defer", value2: "Third" });
	});

	it("calls the subscription", () => {
		// arrange
		const mockSub = jest.fn();
		const mockSubscription = jest.fn().mockReturnValue([cmd.ofSub(mockSub)]);
		const [initModel, initCmd] = defaultInit();
		const props: Props = {
			init: () => [initModel, initCmd],
			update: defaultUpdate,
			subscription: mockSubscription,
		};

		// act
		renderComponent(props);

		// assert
		expect(mockSubscription).toHaveBeenCalledWith(initModel, props);
		expect(mockSub).toHaveBeenCalledWith(expect.anything());
	});

	it("calls the subscriptions destructor if provided", () => {
		// arrange
		const mockDestructor = jest.fn();
		const mockSubscription = jest.fn().mockReturnValue([[], mockDestructor]);
		const [initModel, initCmd] = defaultInit();
		const props: Props = {
			init: () => [initModel, initCmd],
			update: defaultUpdate,
			subscription: mockSubscription,
		};

		// act
		const api = renderComponent(props);

		api.unmount();

		// assert
		expect(mockDestructor).toHaveBeenCalledWith();
	});

	it("calls the subscription function and its destructor", () => {
		// arrange
		const mockDestructor = jest.fn();
		const mockSub = jest.fn().mockReturnValue(mockDestructor);
		const mockSubscription = jest.fn().mockReturnValue([mockSub]);
		const [initModel, initCmd] = defaultInit();
		const props: Props = {
			init: () => [initModel, initCmd],
			update: defaultUpdate,
			subscription: mockSubscription,
		};

		// act
		const api = renderComponent(props);

		api.unmount();

		// assert
		expect(mockSub).toHaveBeenCalledTimes(1);
		expect(mockDestructor).toHaveBeenCalledWith();
	});

	it("reinitializes the model when reInitOn changes", () => {
		// arrange
		const init = jest.fn().mockReturnValue([{}, []]);
		const update = jest.fn();
		let props: Props = {
			init,
			update,
			reInitOn: [1],
		};

		// act
		const api = renderComponent(props);

		expect(init).toHaveBeenCalledTimes(1);
		expect(init).toHaveBeenLastCalledWith(props);

		props = {
			...props,
			reInitOn: [2],
		};

		api.rerender(<TestComponent {...props} />);

		expect(init).toHaveBeenCalledTimes(2);
		expect(init).toHaveBeenLastCalledWith(props);
	});

	it("calls the dispose function on unmount with the current model", () => {
		// arrange
		const mockDispose = jest.fn();
		const [initModel] = defaultInit();
		const props: Props = {
			init: () => defaultInit(),
			update: defaultUpdate,
			dispose: mockDispose,
		};

		// act
		const api = renderComponent(props);

		api.unmount();

		// assert
		expect(mockDispose).toHaveBeenCalledTimes(1);
		expect(mockDispose).toHaveBeenCalledWith(initModel);
	});

	it("does not fail when dispose is not provided", () => {
		// arrange
		const props: Props = {
			init: () => defaultInit(),
			update: defaultUpdate,
		};

		// act
		const api = renderComponent(props);

		// assert
		expect(() => api.unmount()).not.toThrow();
	});

	it("calls the dispose function when reInitOn changes", () => {
		// arrange
		const mockDispose = jest.fn();
		let props: Props = {
			init: () => defaultInit(),
			update: defaultUpdate,
			dispose: mockDispose,
			reInitOn: [1],
		};

		// act
		const api = renderComponent(props);

		expect(mockDispose).not.toHaveBeenCalled();

		props = { ...props, reInitOn: [2] };
		api.rerender(<TestComponent {...props} />);

		// assert
		expect(mockDispose).toHaveBeenCalledTimes(1);
	});

	it("calls dispose before init when reInitOn changes", () => {
		// arrange
		const callOrder: string[] = [];
		const mockDispose = jest.fn(() => {
			callOrder.push("dispose");
		});
		const init = jest.fn(() => {
			callOrder.push("init");

			return defaultInit();
		});
		let props: Props = {
			init,
			update: defaultUpdate,
			dispose: mockDispose,
			reInitOn: [1],
		};

		// act
		const api = renderComponent(props);

		props = { ...props, reInitOn: [2] };
		api.rerender(<TestComponent {...props} />);

		// assert
		expect(callOrder).toStrictEqual(["init", "dispose", "init"]);
	});

	it("calls the subscription function again when reInitOn changes", () => {
		// arrange
		const mockDestructor = jest.fn();
		const mockSub = jest.fn().mockReturnValue(mockDestructor);
		const mockSubscription = jest.fn().mockReturnValue([mockSub]);
		const [initModel, initCmd] = defaultInit();
		let props: Props = {
			init: () => [initModel, initCmd],
			update: defaultUpdate,
			subscription: mockSubscription,
			reInitOn: [1, "other prop"],
		};

		// act
		const api = renderComponent(props);

		// assert
		expect(mockSub).toHaveBeenCalledTimes(1);

		props = {
			...props,
			reInitOn: [1, "changed prop"],
		};

		api.rerender(<TestComponent {...props} />);

		expect(mockSub).toHaveBeenCalledTimes(2);
	});

	it("uses the re-initialized model for messages dispatched after reInitOn changes", () => {
		// arrange
		let initCount = 0;
		const init = (): InitResult<Model, Message> => {
			initCount++;

			return [{ value1: `init${initCount}`, value2: "" }];
		};
		let props: Props = {
			init,
			update: defaultUpdate,
			reInitOn: [1],
		};

		const api = renderComponent(props);

		act(() => componentDispatch?.({ name: "First" }));

		expect(componentModel).toStrictEqual({ value1: "First", value2: "Second" });

		props = { ...props, reInitOn: [2] };
		api.rerender(<TestComponent {...props} />);

		expect(componentModel).toStrictEqual({ value1: "init2", value2: "" });

		// act
		act(() => componentDispatch?.({ name: "Third" }));

		// assert
		expect(componentModel).toStrictEqual({ value1: "init2", value2: "Third" });
	});

	it("keeps processing messages after an update handler has thrown", () => {
		// arrange
		const update = jest.fn(defaultUpdate).mockImplementationOnce(() => {
			throw new Error("update failed");
		});
		const props: Props = {
			init: () => defaultInit(),
			update,
		};

		renderComponent(props);

		expect(() => act(() => componentDispatch?.({ name: "Test" }))).toThrow("update failed");

		// act
		act(() => componentDispatch?.({ name: "Third" }));

		// assert
		expect(componentModel).toStrictEqual({ value1: "", value2: "Third" });
	});

	it("calls the subscription with the re-initialized model when reInitOn changes", () => {
		// arrange
		let initCount = 0;
		const init = (): InitResult<Model, Message> => {
			initCount++;

			return [{ value1: `init${initCount}`, value2: "" }];
		};
		const mockSubscription = jest.fn((_model: Model): SubscriptionResult<Message> => []);
		let props: Props = {
			init,
			update: defaultUpdate,
			subscription: mockSubscription,
			reInitOn: [1],
		};

		const api = renderComponent(props);

		expect(mockSubscription.mock.lastCall?.[0]).toStrictEqual({ value1: "init1", value2: "" });

		// act
		props = { ...props, reInitOn: [2] };
		api.rerender(<TestComponent {...props} />);

		// assert
		expect(mockSubscription.mock.lastCall?.[0]).toStrictEqual({ value1: "init2", value2: "" });
	});
});

function TestComponent(props: Props): JSX.Element {
	const { init, update, subscription, dispose, reInitOn } = props;
	const [model, dispatch] = useElmish({
		props,
		init,
		update,
		subscription,
		dispose,
		reInitOn,
		name: "Test",
	});

	/* eslint-disable react/globals, unicorn/no-top-level-assignment-in-function -- Test only. */
	// biome-ignore lint/nursery/useReactCompiler: Test only.
	componentModel = model;
	// biome-ignore lint/nursery/useReactCompiler: Test only.
	componentDispatch = dispatch;
	/* eslint-enable react/globals, unicorn/no-top-level-assignment-in-function */

	return <div />;
}

function renderComponent(props: Props): RenderResult {
	return render(<TestComponent {...props} />);
}
