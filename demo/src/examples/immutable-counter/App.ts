import type { InitResult } from "react-elmish";
import type { UpdateMap } from "react-elmish/immutable";

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

const update: UpdateMap<Props, Model, Message> = {
	increment(_msg, model) {
		model.value += 1;

		return [];
	},
	decrement(_msg, model) {
		model.value -= 1;

		return [];
	},
};

export type { Message, Model, Props };

export { init, Msg, update };
