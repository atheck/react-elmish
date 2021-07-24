import { ILogger, init } from "../src/Init";
import { handleError } from "../src/ElmUtilities";

describe("ElmUtilities", () => {
    describe("handleError", () => {
        it("returns empty new model", () => {
            // act
            const [model, cmd] = handleError(new Error());

            // assert
            expect(model).toEqual({});
            expect(cmd).toBeUndefined();
        });

        it("calls the error middleware if specified", () => {
            // arrange
            const mockErrorMiddleware = jest.fn();
            init({
                errorMiddleware: mockErrorMiddleware,
            });
            const error = new Error("Some error");

            // act
            handleError(error);

            // assert
            expect(mockErrorMiddleware).toHaveBeenCalledTimes(1);
            expect(mockErrorMiddleware).toHaveBeenCalledWith(error);
        });

        it("does work without an error middleware", () => {
            // arrange
            init({});
            const error = new Error("Some error");

            // act
            const succeeds = () => handleError(error);

            // assert
            expect(succeeds).not.toThrow();
        });

        it("calls the logger service if specified", () => {
            // arrange
            const mockLogError = jest.fn();
            const mockLogger: ILogger = {
                debug: jest.fn(),
                info: jest.fn(),
                error: mockLogError,
            }
            init({
                logger: mockLogger,
            });
            const error = new Error("Some error");

            // act
            handleError(error);

            // assert
            expect(mockLogError).toHaveBeenCalledTimes(1);
            expect(mockLogError).toHaveBeenCalledWith(error);
        });
    });
});