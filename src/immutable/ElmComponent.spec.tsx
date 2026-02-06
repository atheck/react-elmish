import { type RenderResult, render } from "@testing-library/react";
import type { JSX } from "react";
import { cmd } from "../cmd";
import type { Cmd } from "../Types";
import { ElmComponent } from "./ElmComponent";
import type { UpdateReturnType } from "./Types";

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
		const initModel: Model = { value: 42 };
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
		const init = jest.fn().mockReturnValue([{ value: 42 }, cmd.ofMsg(message)]);
		const update = jest.fn((): UpdateReturnType<Message> => []);
		const props: Props = {
			init,
			update,
		};

		// act
		renderComponent(props);

		// assert
		expect(update).toHaveBeenCalledTimes(1);
	});
});

interface Message {
	name: "Test";
}

interface Model {
	value: number;
}

interface Props {
	init: () => [Model, Cmd<Message>];
	update: (model: Model, msg: Message, props: Props) => UpdateReturnType<Message>;
}

class TestComponent extends ElmComponent<Model, Message, Props> {
	public constructor(props: Props) {
		super(props, props.init, "Test");
	}

	public update = this.props.update;

	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
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

	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	public override render(): JSX.Element {
		return <div />;
	}
}

function renderComponent(props: Props): RenderResult {
	return render(<TestComponent {...props} />);
}
