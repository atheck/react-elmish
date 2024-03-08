import type { UpdateReturnType } from ".";
import { errorHandler, errorMsg, handleError } from "./ErrorHandling";
import { init, type Logger } from "./Init";

describe("ErrorHandling", () => {
	describe("errorMsg", () => {
		it("creates the correct message", () => {
			// arrange
			const error = new Error("Message");

			// act
			const result = errorMsg.error(error);

			// assert
			expect(result).toStrictEqual({ name: "error", error });
		});
	});

	describe("errorHandler", () => {
		it("returns object with an error handler function", () => {
			// arrange

			// act
			const result = errorHandler();

			result.error({ name: "error", error: new Error("Message") });

			// assert
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			expect(result).toStrictEqual({ error: expect.any(Function) });
		});
	});

	describe("handleError", () => {
		it("returns empty new model", () => {
			// act
			const [model, cmd] = handleError(new Error("error"));

			// assert
			expect(model).toStrictEqual({});
			expect(cmd).toBeUndefined();
		});

		it("calls the error middleware if specified", () => {
			// arrange
			const mockErrorMiddleware = jest.fn();
			const error = new Error("Some error");

			init({
				errorMiddleware: mockErrorMiddleware,
			});

			// act
			handleError(error);

			// assert
			expect(mockErrorMiddleware).toHaveBeenCalledTimes(1);
			expect(mockErrorMiddleware).toHaveBeenCalledWith(error);
		});

		it("does work without an error middleware", () => {
			// arrange
			const error = new Error("Some error");

			init({});

			// act
			const succeeds = (): UpdateReturnType<unknown, unknown> => handleError(error);

			// assert
			expect(succeeds).not.toThrow();
		});

		it("calls the logger service if specified", () => {
			// arrange
			const mockLogError = jest.fn();
			const mockLogger: Logger = {
				debug: jest.fn(),
				info: jest.fn(),
				error: mockLogError,
			};
			const error = new Error("Some error");

			init({
				logger: mockLogger,
			});

			// act
			handleError(error);

			// assert
			expect(mockLogError).toHaveBeenCalledTimes(1);
			expect(mockLogError).toHaveBeenCalledWith(error);
		});
	});
});
