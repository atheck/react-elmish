import { render } from "@testing-library/react";
import type { JSX } from "react";
import { useElmish as useImmutableElmish } from "./immutable";
import type { InitResult, SubscriptionResult } from "./Types";
import { useElmish } from "./useElmish";

interface Message {
	name: "noop";
}

interface Model {
	value: string;
}

interface Props {
	id: number;
	events: string[];
	withDispose?: boolean;
}

function init({ id }: Props): InitResult<Model, Message> {
	return [{ value: `model ${id}` }];
}

function subscription(model: { readonly value: string }, { events }: Props): SubscriptionResult<Message> {
	return [
		() => {
			events.push(`subscribe ${model.value}`);

			return () => {
				events.push(`unsubscribe ${model.value}`);
			};
		},
	];
}

function getDispose({ events, withDispose = true }: Props): ((model: { readonly value: string }) => void) | undefined {
	if (!withDispose) {
		return undefined;
	}

	return (model) => {
		events.push(`dispose ${model.value}`);
	};
}

function MutableComponent(props: Props): JSX.Element {
	const [{ value }] = useElmish<Props, Model, Message>({
		name: "MutableComponent",
		props,
		reInitOn: [props.id],
		init,
		update: () => [{}],
		subscription,
		dispose: getDispose(props),
	});

	return <p>{value}</p>;
}

function ImmutableComponent(props: Props): JSX.Element {
	const [{ value }] = useImmutableElmish<Props, Model, Message>({
		name: "ImmutableComponent",
		props,
		reInitOn: [props.id],
		init,
		update: () => [],
		subscription,
		dispose: getDispose(props),
	});

	return <p>{value}</p>;
}

describe.each([
	["useElmish", MutableComponent],
	["immutable useElmish", ImmutableComponent],
])("subscription and dispose with %s", (_name, Component) => {
	it("ends the subscription before disposing the model on unmount", () => {
		// arrange
		const events: string[] = [];
		const api = render(<Component events={events} id={1} />);

		// act
		api.unmount();

		// assert
		expect(events).toStrictEqual(["subscribe model 1", "unsubscribe model 1", "dispose model 1"]);
	});

	it("ends the subscription before disposing the model on re-initialization", () => {
		// arrange
		const events: string[] = [];
		const api = render(<Component events={events} id={1} />);

		// act
		api.rerender(<Component events={events} id={2} />);

		// assert
		expect(events).toStrictEqual(["subscribe model 1", "unsubscribe model 1", "dispose model 1", "subscribe model 2"]);
	});

	it("ends the subscription only once on re-initialization and unmount", () => {
		// arrange
		const events: string[] = [];
		const api = render(<Component events={events} id={1} />);

		// act
		api.rerender(<Component events={events} id={2} />);
		api.unmount();

		// assert
		expect(events).toStrictEqual([
			"subscribe model 1",
			"unsubscribe model 1",
			"dispose model 1",
			"subscribe model 2",
			"unsubscribe model 2",
			"dispose model 2",
		]);
	});

	it("ends the subscription on re-initialization without a dispose function", () => {
		// arrange
		const events: string[] = [];
		const api = render(<Component events={events} id={1} withDispose={false} />);

		// act
		api.rerender(<Component events={events} id={2} withDispose={false} />);

		// assert
		expect(events).toStrictEqual(["subscribe model 1", "unsubscribe model 1", "subscribe model 2"]);
	});
});
