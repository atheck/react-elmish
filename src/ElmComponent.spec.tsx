import { render, type RenderResult } from "@testing-library/react";
import type { JSX } from "react";
import { ElmComponent, cmd, type Cmd, type UpdateReturnType } from ".";

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

	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	public override render(): JSX.Element {
		return <div />;
	}
}

function renderComponent(props: Props): RenderResult {
	return render(<TestComponent {...props} />);
}
