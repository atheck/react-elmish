import { act, type RenderResult, render } from "@testing-library/react";
import { createRef, type JSX } from "react";
import { type Cmd, cmd, ElmComponent, type UpdateReturnType } from ".";

describe("ElmComponent", () => {
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

	it("calls the dispose function on unmount", () => {
		// arrange
		const mockDispose = jest.fn();
		const initModel: Model = {};
		const init = jest.fn().mockReturnValue([initModel, []]);
		const update = jest.fn();
		const props: DisposeProps = {
			init,
			update,
			dispose: mockDispose,
		};

		// act
		const api = render(<DisposeTestComponent {...props} />);

		api.unmount();

		// assert
		expect(mockDispose).toHaveBeenCalledTimes(1);
		expect(mockDispose).toHaveBeenCalledWith(initModel);
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

	it("keeps processing messages after the update function has thrown", () => {
		// arrange
		const ref = createRef<LockTestComponent>();

		render(<LockTestComponent ref={ref} />);

		expect(() => act(() => ref.current?.dispatch({ name: "Fail" }))).toThrow("update failed");

		// act
		act(() => ref.current?.dispatch({ name: "Increment" }));

		// assert
		expect(ref.current?.model).toStrictEqual({ count: 1 });
	});
});

interface Message {
	name: "Test";
}

interface Model {}

interface Props {
	init: () => [Model, Cmd<Message>];
	update: (model: Model, msg: Message, props: Props) => UpdateReturnType<Model, Message>;
}

class TestComponent extends ElmComponent<Model, Message, Props> {
	public constructor(props: Props) {
		super(props, props.init, "Test");
	}

	public update = this.props.update;

	// biome-ignore lint/style/useThisInClassMethods: Test only.
	public override render(): JSX.Element {
		return <div />;
	}
}

interface DisposeProps extends Props {
	dispose: (model: Model) => void;
}

class DisposeTestComponent extends ElmComponent<Model, Message, DisposeProps> {
	public constructor(props: DisposeProps) {
		super(props, props.init, "Test", props.dispose);
	}

	public update = this.props.update;

	// biome-ignore lint/style/useThisInClassMethods: Test only.
	public override render(): JSX.Element {
		return <div />;
	}
}

function renderComponent(props: Props): RenderResult {
	return render(<TestComponent {...props} />);
}

type LockMessage = { name: "Fail" } | { name: "Increment" };

interface LockModel {
	count: number;
}

class LockTestComponent extends ElmComponent<LockModel, LockMessage, object> {
	public constructor(props: object) {
		super(props, () => [{ count: 0 }], "LockTest");
	}

	// biome-ignore lint/style/useThisInClassMethods: Test only.
	public update = (model: LockModel, msg: LockMessage): UpdateReturnType<LockModel, LockMessage> => {
		if (msg.name === "Fail") {
			throw new Error("update failed");
		}

		return [{ count: model.count + 1 }];
	};

	// biome-ignore lint/style/useThisInClassMethods: Test only.
	public override render(): JSX.Element {
		return <div />;
	}
}
