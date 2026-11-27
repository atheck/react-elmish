import { produce } from "immer";
import { cmd } from "../../cmd";
import type { Commands } from "../../Types";
import type { UpdateMap } from "../Types";
import { createCallBase, createDefer } from ".";

type Message = { name: "load" } | { name: "loaded" };

interface Model {
	isLoading: boolean;
	items: string[];
}

interface Props {
	item: string;
}

const baseUpdateMap: UpdateMap<Props, Model, Message> = {
	load(_msg, model, props, { defer }) {
		model.items.push(props.item);
		defer(cmd.ofMsg({ name: "loaded" }));

		model.isLoading = true;

		return [];
	},
	loaded(_msg, model) {
		model.isLoading = false;

		return [];
	},
};

describe("react-elmish/immutable/extend", () => {
	it("creates defer and callBase functions which run a base handler on the draft", () => {
		// arrange
		const msg: Message = { name: "load" };
		const model: Model = { isLoading: false, items: ["first"] };
		const [defer, getDeferred] = createDefer<Message>();
		let commands: Commands<Message> = [];

		// act
		const updatedModel = produce(model, (draft) => {
			const callBase = createCallBase(msg, draft, { item: "second" }, { defer });

			commands = callBase(baseUpdateMap.load);
		});

		// assert
		expect(updatedModel).toStrictEqual({ isLoading: true, items: ["first", "second"] });
		expect(model).toStrictEqual({ isLoading: false, items: ["first"] });
		expect(commands).toStrictEqual([]);
		expect(getDeferred()).toHaveLength(1);
	});
});
