import { render, screen } from "@testing-library/react";
import { type JSX, StrictMode } from "react";
import { cmd } from "./cmd";
import { ElmComponent } from "./ElmComponent";
import { useElmish as useImmutableElmish } from "./immutable";
import type { InitResult, Sub } from "./Types";
import { useElmish } from "./useElmish";

interface Message {
	name: "loaded";
}

interface Model {
	value: string;
}

interface Props {
	init: () => InitResult<Model, Message>;
	reInitOn?: unknown[];
}

function MutableComponent(props: Props): JSX.Element {
	const { init, reInitOn } = props;
	const [{ value }] = useElmish<Props, Model, Message>({
		name: "MutableComponent",
		props,
		init,
		update: () => [{ value: "loaded" }],
		reInitOn,
	});

	return <p>{value}</p>;
}

function ImmutableComponent(props: Props): JSX.Element {
	const { init, reInitOn } = props;
	const [{ value }] = useImmutableElmish<Props, Model, Message>({
		name: "ImmutableComponent",
		props,
		init,
		update(model) {
			model.value = "loaded";

			return [];
		},
		reInitOn,
	});

	return <p>{value}</p>;
}

class ClassComponent extends ElmComponent<Model, Message, Props> {
	public constructor(props: Props) {
		super(props, props.init, "ClassComponent");
	}

	// biome-ignore lint/style/useThisInClassMethods: Test only.
	public update = (): [Partial<Model>] => [{ value: "loaded" }];

	public override render(): JSX.Element {
		const { value } = this.model;

		return <p>{value}</p>;
	}
}

function createInit(sub: Sub<Message>): () => InitResult<Model, Message> {
	return () => [{ value: "initial" }, cmd.ofSub(sub)];
}

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
	["ElmComponent", ClassComponent],
])("init commands with %s", (_name, Component) => {
	it("executes the init commands only once in StrictMode", () => {
		// arrange
		const sub = jest.fn();

		// act
		render(
			<StrictMode>
				<Component init={createInit(sub)} />
			</StrictMode>,
		);

		// assert
		expect(sub).toHaveBeenCalledTimes(1);
	});

	it("executes the init commands after the component is mounted", () => {
		// arrange
		let isRenderedWhenExecuted: boolean | undefined;
		const sub = jest.fn(() => {
			isRenderedWhenExecuted = screen.queryByText("initial") !== null;
		});

		// act
		render(<Component init={createInit(sub)} />);

		// assert
		expect(sub).toHaveBeenCalledTimes(1);
		expect(isRenderedWhenExecuted).toBe(true);
	});

	it("processes the messages of the init commands", () => {
		// arrange
		const init = (): InitResult<Model, Message> => [{ value: "initial" }, cmd.ofMsg({ name: "loaded" })];

		// act
		render(<Component init={init} />);

		// assert
		expect(screen.getByText("loaded")).toBeInTheDocument();
	});
});

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
])("init commands after reInitOn changes with %s", (_name, Component) => {
	it("does not re-initialize when mounted in StrictMode", () => {
		// arrange
		const init = jest.fn(createInit(jest.fn()));

		// act
		render(
			<StrictMode>
				<Component init={init} reInitOn={[1]} />
			</StrictMode>,
		);

		// assert
		// React reuses the state of the first render when StrictMode calls the component function a second time.
		expect(init).toHaveBeenCalledTimes(1);
	});

	it("executes the init commands of the re-initialization once", () => {
		// arrange
		const sub = jest.fn();
		const init = createInit(sub);
		const api = render(<Component init={init} reInitOn={[1]} />);

		// act
		api.rerender(<Component init={init} reInitOn={[2]} />);

		// assert
		expect(sub).toHaveBeenCalledTimes(2);
	});

	it("executes the init commands of the re-initialization once in StrictMode", () => {
		// arrange
		const sub = jest.fn();
		const init = createInit(sub);
		const api = render(
			<StrictMode>
				<Component init={init} reInitOn={[1]} />
			</StrictMode>,
		);

		sub.mockClear();

		// act
		api.rerender(
			<StrictMode>
				<Component init={init} reInitOn={[2]} />
			</StrictMode>,
		);

		// assert
		expect(sub).toHaveBeenCalledTimes(1);
	});
});
