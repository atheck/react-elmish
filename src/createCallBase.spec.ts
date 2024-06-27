import type { UpdateMap } from "./Types";

type Message1 = { name: "test"; param: string } | { name: "second" };
type Message2 = { name: "first" } | Message1;

const updateMap1: UpdateMap<{}, {}, Message1> = {
	test() {
		return [{}];
	},

	second() {
		return [{}];
	},
};

const updateMap2: UpdateMap<{}, {}, Message2> = {
	first() {
		return [{}];
	},

	...updateMap1,

	test(_msg, _model, _props, { callBase }) {
		callBase(updateMap1.test);

		return [{}];
	},
};
