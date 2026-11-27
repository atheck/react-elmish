import { init, type Logger } from "../Init";
import { errorHandler, handleError } from "./ErrorHandling";

describe("immutable ErrorHandling", () => {
	afterEach(() => {
		init({});
	});

	describe("errorHandler", () => {
		it("handles the error message and returns no commands", () => {
			// arrange
			const mockErrorMiddleware = jest.fn();
			const error = new Error("Message");

			init({ errorMiddleware: mockErrorMiddleware });

			// act
			const result = errorHandler().error({ name: "error", error });

			// assert
			expect(result).toStrictEqual([]);
			expect(mockErrorMiddleware).toHaveBeenCalledWith(error);
		});
	});

	describe("handleError", () => {
		it("returns no commands", () => {
			// act
			const result = handleError(new Error("error"));

			// assert
			expect(result).toStrictEqual([]);
		});

		it("calls the error middleware and the logger if specified", () => {
			// arrange
			const mockErrorMiddleware = jest.fn();
			const mockLogger: Logger = { debug: jest.fn(), info: jest.fn(), error: jest.fn() };
			const error = new Error("Some error");

			init({ errorMiddleware: mockErrorMiddleware, logger: mockLogger });

			// act
			handleError(error);

			// assert
			expect(mockErrorMiddleware).toHaveBeenCalledTimes(1);
			expect(mockErrorMiddleware).toHaveBeenCalledWith(error);
			expect(mockLogger.error).toHaveBeenCalledTimes(1);
			expect(mockLogger.error).toHaveBeenCalledWith(error);
		});

		it("does work without an error middleware and logger", () => {
			// arrange
			init({});

			// act
			const handle = (): unknown => handleError(new Error("Some error"));

			// assert
			expect(handle).not.toThrow();
		});
	});
});
