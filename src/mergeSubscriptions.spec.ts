import { cmd } from "./cmd";
import { execCmd } from "./Common";
import { mergeSubscriptions } from "./mergeSubscriptions";
import type { Message } from "./Types";
import type { SubscriptionResult } from "./useElmish";

describe("mergeSubscriptions", () => {
	const model = {};
	const props = {};

	it("accepts subscription functions and undefined and returns a function", () => {
		// arrange
		const emptySubscription = (): SubscriptionResult<Message> => [cmd.ofSub(jest.fn())];

		// act
		const subscription = mergeSubscriptions(emptySubscription, undefined, emptySubscription);

		// assert
		expect(typeof subscription).toBe("function");
	});

	it("calls all subscriptions with model and props", () => {
		// arrange

		const sub1 = jest.fn();
		const sub2 = jest.fn();
		const sub3 = jest.fn();

		const subscription = mergeSubscriptions(sub1, sub2, sub3);

		// act
		subscription(model, props);

		// assert
		expect(sub1).toHaveBeenCalledWith(model, props);
		expect(sub2).toHaveBeenCalledWith(model, props);
		expect(sub3).toHaveBeenCalledWith(model, props);
	});

	it("executes all command functions", () => {
		// arrange
		const mockDispatch = jest.fn();

		const sub1Fn = jest.fn();
		const sub1 = (): SubscriptionResult<Message> => [cmd.ofSub(sub1Fn)];
		const sub2Fn = jest.fn();
		const sub2 = (): SubscriptionResult<Message> => [cmd.ofSub(sub2Fn)];

		const subscription = mergeSubscriptions(sub1, sub2);
		const [command] = subscription(model, props);

		// act
		execCmd(mockDispatch, command);

		// assert
		expect(sub1Fn).toHaveBeenCalledWith(mockDispatch);
		expect(sub2Fn).toHaveBeenCalledWith(mockDispatch);
	});

	it("executes all disposer functions", () => {
		// arrange
		const dispose1 = jest.fn();
		const sub1 = (): SubscriptionResult<Message> => [cmd.ofSub(jest.fn()), dispose1];
		const dispose2 = jest.fn();
		const sub2 = (): SubscriptionResult<Message> => [cmd.ofSub(jest.fn()), dispose2];

		const subscription = mergeSubscriptions(sub1, sub2);
		const [, dispose] = subscription(model, props);

		// act
		dispose?.();

		// assert
		expect(dispose1).toHaveBeenCalledTimes(1);
		expect(dispose2).toHaveBeenCalledTimes(1);
	});
});
