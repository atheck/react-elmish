import { cmd } from "../cmd";
import type { Message as BaseMessage, UpdateMap } from "../Types";
import { createCallBase, createDefer } from ".";

type Message = { name: "load" } | { name: "loaded" };

interface Model {
	isLoading: boolean;
	count: number;
}

interface Props {
	step: number;
}

const baseUpdateMap: UpdateMap<Props, Model, Message> = {
	load(_msg, model, props, { defer }) {
		defer({ count: model.count + props.step }, cmd.ofMsg({ name: "loaded" }));

		return [{ isLoading: true }];
	},
	loaded() {
		return [{ isLoading: false }];
	},
};

describe("react-elmish/extend", () => {
	it("creates defer and callBase functions which run a base handler like the runtime", () => {
		// arrange
		const msg: Message = { name: "load" };
		const model: Model = { isLoading: false, count: 1 };
		const props: Props = { step: 2 };
		const [defer, getDeferred] = createDefer<Model, Message>();
		const callBase = createCallBase(msg, model, props, { defer });

		// act
		const [changes, ...commands] = callBase(baseUpdateMap.load);
		const [deferredModel, deferredCommands] = getDeferred();

		// assert
		expect(changes).toStrictEqual({ isLoading: true });
		expect(commands).toStrictEqual([]);
		expect(deferredModel).toStrictEqual({ count: 3 });
		expect(deferredCommands).toHaveLength(1);
	});

	it("passes the callBase function to the base handler, so it can call its own base handler", () => {
		// arrange
		const msg: Message = { name: "load" };
		const model: Model = { isLoading: false, count: 1 };
		const [defer] = createDefer<Model, Message>();
		const callBase = createCallBase(msg, model, { step: 1 }, { defer });

		// act
		const [changes] = callBase<BaseMessage>((_msg, _model, _props, options) => options.callBase(baseUpdateMap.load));

		// assert
		expect(changes).toStrictEqual({ isLoading: true });
	});
});
