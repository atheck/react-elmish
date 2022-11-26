import { cmd } from "./cmd";

type Message =
    | { name: "none" }
    | { name: "success" }
    | { name: "error" };

const successMsg = (): Message => ({ name: "success" });
const errorMsg = (): Message => ({ name: "error" });
const resolveTask = async (): Promise<unknown> => undefined;

describe("cmd", () => {
    describe("batch", () => {
        it("keeps the order", () => {
            // arrange
            const dispatch = jest.fn();

            // act
            const batchedCommands = cmd.batch(cmd.ofMsg(successMsg()), cmd.ofMsg(errorMsg()));

            batchedCommands.forEach(command => command(dispatch));

            // assert
            expect(batchedCommands).toHaveLength(2);
            expect(dispatch).toHaveBeenNthCalledWith(1, { name: "success" });
            expect(dispatch).toHaveBeenNthCalledWith(2, { name: "error" });
        });

        it("supports nullish values", () => {
            // arrange
            const dispatch = jest.fn();

            // act
            const batchedCommands = cmd.batch(undefined, cmd.ofMsg(successMsg()), null, cmd.ofMsg(errorMsg()));

            batchedCommands.forEach(command => command(dispatch));

            // assert
            expect(batchedCommands).toHaveLength(2);
            expect(dispatch).toHaveBeenNthCalledWith(1, { name: "success" });
            expect(dispatch).toHaveBeenNthCalledWith(2, { name: "error" });
        });
    });

    describe("ofFunc", () => {
        describe("either", () => {
            it("returns one function", () => {
                // arrange
                const result = cmd.ofFunc.either(jest.fn(), successMsg, errorMsg);

                // assert
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(Function);
            });

            it("runs the task", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.either(task, successMsg, errorMsg);

                // act
                result[0]?.(() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("dispatches the success message", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.either(task, successMsg, errorMsg);

                // act
                let message: Message = { name: "none" };

                result[0]?.(msg => {
                    message = msg;
                });

                // assert
                expect(message.name).toBe("success");
            });

            it("dispatches the error message", () => {
                // arrange
                const task = jest.fn(() => {
                    throw new Error("error");
                });
                const result = cmd.ofFunc.either(task, successMsg, errorMsg);

                // act
                let message: Message = { name: "none" };

                result[0]?.(msg => {
                    message = msg;
                });

                // assert
                expect(message.name).toBe("error");
            });
        });

        describe("perform", () => {
            it("returns one function", () => {
                // arrange
                const result = cmd.ofFunc.perform(jest.fn(), successMsg);

                // assert
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(Function);
            });

            it("runs the task", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.perform(task, successMsg);

                // act
                result[0]?.(() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("dispatches the success message", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.perform(task, successMsg);

                // act
                let message: Message = { name: "none" };

                result[0]?.(msg => {
                    message = msg;
                });

                // assert
                expect(message.name).toBe("success");
            });

            it("ignores an error", () => {
                // arrange
                const task = jest.fn(() => {
                    throw new Error("error");
                });
                const result = cmd.ofFunc.perform(task, successMsg);

                // act
                let message: Message = { name: "none" };

                result[0]?.(msg => {
                    message = msg;
                });

                // assert
                expect(message.name).toBe("none");
            });
        });

        describe("attempt", () => {
            it("returns one function", () => {
                // arrange
                const result = cmd.ofFunc.attempt(jest.fn(), errorMsg);

                // assert
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(Function);
            });

            it("runs the task", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.attempt(task, errorMsg);

                // act
                result[0]?.(() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("ignores the success", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.attempt(task, errorMsg);

                // act
                let message: Message = { name: "none" };

                result[0]?.(msg => {
                    message = msg;
                });

                // assert
                expect(message.name).toBe("none");
            });

            it("dispatches the error message", () => {
                // arrange
                const task = jest.fn(() => {
                    throw new Error("error");
                });
                const result = cmd.ofFunc.attempt(task, errorMsg);

                // act
                let message: Message = { name: "none" };

                result[0]?.(msg => {
                    message = msg;
                });

                // assert
                expect(message.name).toBe("error");
            });
        });
    });

    describe("ofPromise", () => {
        describe("either", () => {
            it("returns one function", () => {
                // arrange
                const result = cmd.ofPromise.either(resolveTask, successMsg, errorMsg);

                // assert
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(Function);
            });

            it("runs the task", () => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.either(task, successMsg, errorMsg);

                // act
                result[0]?.(() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("dispatches the success message", async () => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.either(task, successMsg, errorMsg);

                // act
                const act = async (): Promise<Message> => new Promise(resolve => {
                    result[0]?.(resolve);
                });
                const message = await act();

                // assert
                expect(message.name).toBe("success");
            });

            it("dispatches the error message", async () => {
                // arrange
                const task = jest.fn(async () => {
                    throw new Error("error");
                });
                const result = cmd.ofPromise.either(task, successMsg, errorMsg);

                // act
                const act = async (): Promise<Message> => new Promise(resolve => {
                    result[0]?.(resolve);
                });
                const message = await act();

                // assert
                expect(message.name).toBe("error");
            });
        });

        describe("perform", () => {
            it("returns one function", () => {
                // arrange
                const result = cmd.ofPromise.perform(resolveTask, successMsg);

                // assert
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(Function);
            });

            it("runs the task", () => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.perform(task, successMsg);

                // act
                result[0]?.(() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("dispatches the success message", async () => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.perform(task, successMsg);

                // act
                const act = async (): Promise<Message> => new Promise(resolve => {
                    result[0]?.(resolve);
                });
                const message = await act();

                // assert
                expect(message.name).toBe("success");
            });

            it("ignores an error", async () => {
                // arrange
                const task = jest.fn(async () => {
                    throw new Error("error");
                });
                const result = cmd.ofPromise.perform(task, successMsg);

                // act
                const succeeds = (): void => result[0]?.(jest.fn());

                // assert
                expect(succeeds).not.toThrow();
            });
        });

        describe("attempt", () => {
            it("returns one function", () => {
                // arrange
                const result = cmd.ofPromise.attempt(resolveTask, errorMsg);

                // assert
                expect(result).toHaveLength(1);
                expect(result[0]).toBeInstanceOf(Function);
            });

            it("runs the task", () => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.attempt(task, errorMsg);

                // act
                result[0]?.(() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("ignores the success", async () => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.attempt(task, errorMsg);

                // act
                result[0]?.(jest.fn());

                // assert
                expect(task).toHaveBeenCalledWith();
            });

            it("dispatches the error message", async () => {
                // arrange
                const task = jest.fn(async () => {
                    throw new Error("error");
                });
                const result = cmd.ofPromise.attempt(task, errorMsg);

                // act
                const act = async (): Promise<Message> => new Promise(resolve => {
                    result[0]?.(resolve);
                });
                const message = await act();

                // assert
                expect(message.name).toBe("error");
            });
        });
    });
});