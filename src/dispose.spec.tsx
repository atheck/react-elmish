import { render, screen } from "@testing-library/react";
import { type JSX, StrictMode } from "react";
import { cmd } from "./cmd";
import { ElmComponent } from "./ElmComponent";
import { useElmish as useImmutableElmish } from "./immutable";
import type { InitResult } from "./Types";
import { useElmish } from "./useElmish";

interface Message {
	name: "opened";
}

const disposePattern = /^dispose model/u;

interface Model {
	value: string;
}

interface Props {
	init: () => InitResult<Model, Message>;
	dispose: (model: Model) => void;
}

function MutableComponent(props: Props): JSX.Element {
	const { init, dispose } = props;
	const [{ value }] = useElmish<Props, Model, Message>({
		name: "MutableComponent",
		props,
		init,
		update: () => [{}],
		dispose,
	});

	return <p>{value}</p>;
}

function ImmutableComponent(props: Props): JSX.Element {
	const { init, dispose } = props;
	const [{ value }] = useImmutableElmish<Props, Model, Message>({
		name: "ImmutableComponent",
		props,
		init,
		update: () => [],
		dispose,
	});

	return <p>{value}</p>;
}

class ClassComponent extends ElmComponent<Model, Message, Props> {
	public constructor(props: Props) {
		super(props, props.init, "ClassComponent", props.dispose);
	}

	// biome-ignore lint/style/useThisInClassMethods: Test only.
	public update = (): [Partial<Model>] => [{}];

	public override render(): JSX.Element {
		const { value } = this.model;

		return <p>{value}</p>;
	}
}

/**
 * Creates props which record the calls of init, of the init command ("open"), and of dispose.
 */
function createProps(): [Props, string[]] {
	const events: string[] = [];
	let initCount = 0;

	const props: Props = {
		init() {
			initCount++;
			events.push("init");

			return [
				{ value: `model ${initCount}` },
				cmd.ofSub(() => {
					events.push("open");
				}),
			];
		},
		dispose(model) {
			events.push(`dispose ${model.value}`);
		},
	};

	return [props, events];
}

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
	["ElmComponent", ClassComponent],
])("dispose with %s", (_name, Component) => {
	it("disposes the model on unmount", () => {
		// arrange
		const [props, events] = createProps();
		const api = render(<Component {...props} />);

		// act
		api.unmount();

		// assert
		expect(events).toStrictEqual(["init", "open", "dispose model 1"]);
	});

	it("initializes the model again when it is mounted again in StrictMode after it has been disposed", () => {
		// arrange
		const [props, events] = createProps();

		// act
		render(
			<StrictMode>
				<Component {...props} />
			</StrictMode>,
		);

		// assert
		// StrictMode may call init more than once while rendering, so we only check the events after the first mount.
		const eventsAfterMount = events.slice(events.indexOf("open"));
		const lastInitCount = events.filter((event) => event === "init").length;

		expect(eventsAfterMount).toStrictEqual(["open", expect.stringMatching(disposePattern), "init", "open"]);
		expect(screen.getByText(`model ${lastInitCount}`)).toBeInTheDocument();
	});
});

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
])("dispose function changes with %s", (_name, Component) => {
	it("calls the latest dispose function on unmount", () => {
		// arrange
		const [props] = createProps();
		const mockFirstDispose = jest.fn();
		const mockLatestDispose = jest.fn();
		const api = render(<Component {...props} dispose={mockFirstDispose} />);

		api.rerender(<Component {...props} dispose={mockLatestDispose} />);

		// act
		api.unmount();

		// assert
		expect(mockFirstDispose).not.toHaveBeenCalled();
		expect(mockLatestDispose).toHaveBeenCalledWith({ value: "model 1" });
	});
});
