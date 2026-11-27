import { act, type RenderResult, render } from "@testing-library/react";
import type { Draft } from "immer";
import { createRef, type JSX } from "react";
import { cmd } from "../cmd";
import type { Cmd } from "../Types";
import { ElmComponent } from "./ElmComponent";
import type { UpdateFunction, UpdateReturnType } from "./Types";

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

	it("re-renders only if the model has changed", () => {
		// arrange
		const ref = createRef<RenderCountTestComponent>();

		render(<RenderCountTestComponent ref={ref} />);

		const initialRenderCount = ref.current?.renderCount;

		// act
		act(() => ref.current?.dispatch({ name: "Noop" }));

		const renderCountAfterNoop = ref.current?.renderCount;

		act(() => ref.current?.dispatch({ name: "Increment" }));

		// assert
		expect(initialRenderCount).toBe(1);
		expect(renderCountAfterNoop).toBe(1);
		expect(ref.current?.renderCount).toBe(2);
	});

	it("applies the model changes of the base handler called with callBase", () => {
		// arrange
		const ref = createRef<TestComponent>();
		const base = (_msg: Message, model: Draft<Model>): UpdateReturnType<Message> => {
			model.value += 10;

			return [];
		};
		const props: Props = {
			init: () => [{ value: 1 }, cmd.ofMsg({ name: "Test" })],
			update(model, _msg, _props, { callBase }) {
				model.value *= 2;
				callBase(base);

				return [];
			},
		};

		// act
		render(<TestComponent ref={ref} {...props} />);

		// assert
		expect(ref.current?.model).toStrictEqual({ value: 12 });
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
	update: UpdateFunction<Props, Model, Message>;
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
	public update = (model: Draft<LockModel>, msg: LockMessage): UpdateReturnType<LockMessage> => {
		if (msg.name === "Fail") {
			throw new Error("update failed");
		}

		model.count++;

		return [];
	};

	// biome-ignore lint/style/useThisInClassMethods: Test only.
	public override render(): JSX.Element {
		return <div />;
	}
}

type RenderCountMessage = { name: "Noop" } | { name: "Increment" };

class RenderCountTestComponent extends ElmComponent<LockModel, RenderCountMessage, object> {
	public renderCount = 0;

	public constructor(props: object) {
		super(props, () => [{ count: 0 }], "RenderCountTest");
	}

	// biome-ignore lint/style/useThisInClassMethods: Test only.
	public update = (model: Draft<LockModel>, msg: RenderCountMessage): UpdateReturnType<RenderCountMessage> => {
		if (msg.name === "Increment") {
			model.count++;
		}

		return [];
	};

	public override render(): JSX.Element {
		this.renderCount++;

		return <div />;
	}
}
