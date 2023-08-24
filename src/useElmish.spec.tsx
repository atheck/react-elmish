import { RenderResult, render, waitFor } from "@testing-library/react";
import React, { JSX, useEffect } from "react";
import { Cmd, InitResult, SubscriptionResult, UpdateReturnType, cmd, useElmish } from ".";

type Message = { name: "Test" } | { name: "First" } | { name: "Second" } | { name: "Third" };

interface Model {
	value1: string;
	value2: string;
}

interface Props {
	init: () => InitResult<Model, Message>;
	update: (model: Model, msg: Message, props: Props) => UpdateReturnType<Model, Message>;
	subscription?: (model: Model) => SubscriptionResult<Message>;
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

function defaultUpdate(_model: Model, msg: Message): UpdateReturnType<Model, Message> {
	switch (msg.name) {
		case "Test":
			return [{}];

		case "First":
			return [{ value1: "First" }, cmd.ofMsg({ name: "Second" })];

		case "Second":
			return [{ value2: "Second" }];

		case "Third":
			return [{ value2: "Third" }];
	}
}

let componentModel: Model | undefined;

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
		expect(update).toHaveBeenCalledWith({}, message, props);
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

	it("updates the model correctly with multiple commands delayed", async () => {
		// arrange
		const props: Props = {
			init: () => defaultInit(),
			update(_model: Model, msg: Message): UpdateReturnType<Model, Message> {
				// eslint-disable-next-line jest/no-conditional-in-test
				switch (msg.name) {
					case "Test":
						return [{}];

					case "First":
						return [{ value1: "First" }];

					case "Second":
						return [{ value1: "Second" }];

					case "Third":
						return [{ value2: "Third" }];
				}
			},
		};

		// act
		renderComponentWithEffect(props);

		await waitFor(
			async () =>
				new Promise((resolve) => {
					setTimeout(() => resolve(null), 30);
				}),
		);

		// assert
		expect(componentModel).toStrictEqual({ value1: "Second", value2: "Third" });
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
});

function TestComponent(props: Props): JSX.Element {
	const { init, update, subscription } = props;
	const [model] = useElmish({
		props,
		init,
		update,
		subscription,
		name: "Test",
	});

	componentModel = model;

	return <div />;
}

function renderComponent(props: Props): RenderResult {
	return render(<TestComponent {...props} />);
}

function TestComponentWithEffect(props: Props): JSX.Element {
	const { init, update, subscription } = props;
	const [model, dispatch] = useElmish({
		props,
		init,
		update,
		subscription,
		name: "Test",
	});

	if (model.value1 === "") {
		setTimeout(() => dispatch({ name: "First" }), 5);
	}

	if (model.value1 === "First" && model.value2 === "") {
		setTimeout(() => dispatch({ name: "Second" }), 5);
	}

	componentModel = model;

	useEffect(() => {
		setTimeout(() => {
			dispatch({ name: "Third" });
		}, 20);
	}, [dispatch]);

	return <div />;
}

function renderComponentWithEffect(props: Props): RenderResult {
	return render(<TestComponentWithEffect {...props} />);
}
