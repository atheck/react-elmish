import type { InitResult, UpdateMap, UpdateReturnType } from "react-elmish";

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
	increment(_msg, model): UpdateReturnType<Model, Message> {
		return [{ value: model.value + 1 }];
	},
	decrement(_msg, model): UpdateReturnType<Model, Message> {
		return [{ value: model.value - 1 }];
	},
};

export type { Message, Model, Props };

export { init, Msg, update };
