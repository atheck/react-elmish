import type { InitResult, UpdateReturnType } from "react-elmish";

interface Model {
	value: number;
}

interface Props {
	initialValue: number;
}

type Message = { name: "increment" } | { name: "decrement" };

const Msg = {
	increment: (): Message => ({ name: "increment" }),
	decrement: (): Message => ({ name: "decrement" }),
};

function init(props: Props): InitResult<Model, Message> {
	return [{ value: props.initialValue }];
}

function update(model: Model, msg: Message): UpdateReturnType<Model, Message> {
	switch (msg.name) {
		case "increment":
			return [{ value: model.value + 1 }];

		case "decrement":
			return [{ value: model.value - 1 }];
	}
}

export type { Message, Model, Props };

export { init, Msg, update };
