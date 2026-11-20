/* eslint-disable testing-library/prefer-user-event -- @testing-library/user-event is not installed. */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { type JSX, StrictMode } from "react";
import { cmd } from "./cmd";
import { ElmComponent } from "./ElmComponent";
import { useElmish as useImmutableElmish } from "./immutable";
import type { Dispatch, InitResult, Subscription, UpdateReturnType } from "./Types";
import { useElmish } from "./useElmish";

type Message = { name: "load" } | { name: "loaded"; value: string };

interface Model {
	value: string;
}

interface Props {
	id: string;
	load: (id: string) => Promise<string>;
	onSubscribe?: (dispatch: Dispatch<Message>) => void;
}

function init(props: Props): InitResult<Model, Message> {
	return [{ value: `loading ${props.id}` }, loadCmd(props)];
}

function loadCmd({ id, load }: Props): ReturnType<typeof cmd.ofSuccess<Message, [string], Promise<string>>> {
	return cmd.ofSuccess(load, (value): Message => ({ name: "loaded", value }), id);
}

function update(model: Model, msg: Message, props: Props): UpdateReturnType<Model, Message> {
	switch (msg.name) {
		case "load":
			return [{}, loadCmd(props)];
		case "loaded":
			return [{ value: msg.value }];
		default:
			return [model];
	}
}

const subscription: Subscription<Props, Model, Message> = (_model, props) => [
	cmd.ofSub((dispatch) => props.onSubscribe?.(dispatch)),
];

function MutableComponent(props: Props): JSX.Element {
	const { id } = props;
	const [{ value }, dispatch] = useElmish({
		name: "MutableComponent",
		props,
		reInitOn: [id],
		init,
		update,
		subscription,
		dispose: () => undefined,
	});

	return (
		<button onClick={() => dispatch({ name: "load" })} type={"button"}>
			{value}
		</button>
	);
}

function ImmutableComponent(props: Props): JSX.Element {
	const { id } = props;
	const [{ value }, dispatch] = useImmutableElmish<Props, Model, Message>({
		name: "ImmutableComponent",
		props,
		reInitOn: [id],
		init,
		update(model, msg, currentProps) {
			if (msg.name === "loaded") {
				model.value = msg.value;

				return [];
			}

			return [loadCmd(currentProps)];
		},
		subscription,
		dispose: () => undefined,
	});

	return (
		<button onClick={() => dispatch({ name: "load" })} type={"button"}>
			{value}
		</button>
	);
}

class ClassComponent extends ElmComponent<Model, Message, Props> {
	public constructor(props: Props) {
		super(props, init, "ClassComponent", () => undefined);
	}

	public update = update;

	public override render(): JSX.Element {
		return (
			<button onClick={() => this.dispatch({ name: "load" })} type={"button"}>
				{this.model.value}
			</button>
		);
	}
}

/**
 * Creates a load function whose calls can be resolved one by one.
 * @returns The load function and a function to resolve the call with the given index.
 */
function createLoader(): [Props["load"], (index: number, value: string) => Promise<void>] {
	const resolvers: ((value: string) => void)[] = [];

	const load = async (): Promise<string> => {
		const { promise, resolve } = Promise.withResolvers<string>();

		resolvers.push(resolve);

		return await promise;
	};

	const resolveCall = async (index: number, value: string): Promise<void> => {
		await act(async () => {
			resolvers[index]?.(value);
			await Promise.resolve();
		});
	};

	return [load, resolveCall];
}

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
])("reInitOn with %s", (_name, Component) => {
	it("drops the messages of the init commands of a previous initialization", async () => {
		// arrange
		const [load, resolveCall] = createLoader();
		const api = render(<Component id={"1"} load={load} />);

		api.rerender(<Component id={"2"} load={load} />);

		// act
		await resolveCall(1, "fresh");
		await resolveCall(0, "stale");

		// assert
		expect(screen.getByRole("button")).toHaveTextContent("fresh");
	});

	it("drops the messages of the update commands of a previous initialization", async () => {
		// arrange
		const [load, resolveCall] = createLoader();
		const api = render(<Component id={"1"} load={load} />);

		await resolveCall(0, "first");
		fireEvent.click(screen.getByRole("button"));
		api.rerender(<Component id={"2"} load={load} />);

		// act
		await resolveCall(2, "fresh");
		await resolveCall(1, "stale");

		// assert
		expect(screen.getByRole("button")).toHaveTextContent("fresh");
	});

	it("drops the messages of the subscription of a previous initialization", async () => {
		// arrange
		const [load] = createLoader();
		const onSubscribe = jest.fn<undefined, [Dispatch<Message>]>();
		const api = render(<Component id={"1"} load={load} onSubscribe={onSubscribe} />);

		api.rerender(<Component id={"2"} load={load} onSubscribe={onSubscribe} />);

		// act
		await act(async () => {
			onSubscribe.mock.calls[0]?.[0]({ name: "loaded", value: "stale" });
			await Promise.resolve();
		});

		// assert
		expect(onSubscribe).toHaveBeenCalledTimes(2);
		expect(screen.getByRole("button")).toHaveTextContent("loading 2");
	});
});

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
	["ElmComponent", ClassComponent],
])("remount in StrictMode with %s", (_name, Component) => {
	it("drops the messages of the init commands executed before the model was disposed", async () => {
		// arrange
		const [load, resolveCall] = createLoader();

		render(
			<StrictMode>
				<Component id={"1"} load={load} />
			</StrictMode>,
		);

		// act
		await resolveCall(1, "fresh");
		await resolveCall(0, "stale");

		// assert
		expect(screen.getByRole("button")).toHaveTextContent("fresh");
	});
});
