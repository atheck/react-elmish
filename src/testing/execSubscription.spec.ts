import { cmd } from "../cmd";
import type { Dispatch, Subscription } from "../Types";
import { execSubscription } from "./execSubscription";

interface Message {
	name: "foo";
	value: string;
}

interface Model {
	value: string;
}

interface Props {
	suffix: string;
}

describe("execSubscription", () => {
	const model: Model = { value: "model" };
	const props: Props = { suffix: "props" };

	it("returns a no-op dispose function without a subscription", () => {
		// arrange
		const mockDispatch = jest.fn();

		// act
		const dispose = execSubscription<Props, Model, Message>(undefined, mockDispatch, model, props);

		// assert
		expect(dispose).not.toThrow();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("executes the command of the subscription with the model and props and returns its destructor", () => {
		// arrange
		const mockDispatch = jest.fn();
		const mockDestructor = jest.fn();
		const subscription: Subscription<Props, Model, Message> = (currentModel, currentProps) => [
			cmd.ofMsg({ name: "foo", value: `${currentModel.value}-${currentProps.suffix}` }),
			mockDestructor,
		];

		// act
		const dispose = execSubscription(subscription, mockDispatch, model, props);

		dispose();

		// assert
		expect(mockDispatch).toHaveBeenCalledWith({ name: "foo", value: "model-props" });
		expect(mockDestructor).toHaveBeenCalledTimes(1);
	});

	it("does not throw when disposing a subscription without destructor", () => {
		// arrange
		const subscription: Subscription<Props, Model, Message> = () => [cmd.ofMsg({ name: "foo", value: "" })];

		// act
		const dispose = execSubscription(subscription, jest.fn(), model, props);

		// assert
		expect(dispose).not.toThrow();
	});

	it("runs all subscription functions and disposes all of them", () => {
		// arrange
		const mockDispatch = jest.fn();
		const mockDestructor1 = jest.fn();
		const mockDestructor2 = jest.fn();
		const subscription: Subscription<Props, Model, Message> = () => [
			(dispatch) => {
				dispatch({ name: "foo", value: "first" });

				return mockDestructor1;
			},
			() => undefined,
			(dispatch) => {
				dispatch({ name: "foo", value: "second" });

				return mockDestructor2;
			},
		];

		// act
		const dispose = execSubscription(subscription, mockDispatch, model, props);

		dispose();

		// assert
		expect(mockDispatch).toHaveBeenNthCalledWith(1, { name: "foo", value: "first" });
		expect(mockDispatch).toHaveBeenNthCalledWith(2, { name: "foo", value: "second" });
		expect(mockDestructor1).toHaveBeenCalledTimes(1);
		expect(mockDestructor2).toHaveBeenCalledTimes(1);
	});

	it("accepts subscription functions which return nothing", () => {
		// arrange
		const mockDispatch = jest.fn();
		const sub = (dispatch: Dispatch<Message>): void => {
			dispatch({ name: "foo", value: "no destructor" });
		};
		const subscription: Subscription<Props, Model, Message> = () => [sub];

		// act
		const dispose = execSubscription(subscription, mockDispatch, model, props);

		// assert
		expect(mockDispatch).toHaveBeenCalledWith({ name: "foo", value: "no destructor" });
		expect(dispose).not.toThrow();
	});
});
