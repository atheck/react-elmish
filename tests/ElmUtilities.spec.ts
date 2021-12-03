import { init, Logger } from "../src/Init";
import { handleError } from "../src/ElmUtilities";
import { UpdateReturnType } from "../src";

describe("ElmUtilities", () => {
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