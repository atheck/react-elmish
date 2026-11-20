import { castImmutable } from "immer";
import { cmd } from "../../cmd";
import type { Subscription } from "../Types";
import { execSubscription } from "./execSubscription";

interface Message {
	name: "foo";
	value: string;
}

interface Model {
	value: string;
}

interface Props {}

describe("immutable execSubscription", () => {
	it("executes the subscription with the immutable model and returns the destructor", () => {
		// arrange
		const mockDispatch = jest.fn();
		const mockDestructor = jest.fn();
		const subscription: Subscription<Props, Model, Message> = (model) => [
			cmd.ofMsg({ name: "foo", value: model.value }),
			mockDestructor,
		];

		// act
		const dispose = execSubscription(subscription, mockDispatch, castImmutable({ value: "model" }), {});

		dispose();

		// assert
		expect(mockDispatch).toHaveBeenCalledWith({ name: "foo", value: "model" });
		expect(mockDestructor).toHaveBeenCalledTimes(1);
	});
});
