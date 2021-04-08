import { createCmd } from "../src/Cmd";

const cmd = createCmd<string>();

const successMsg = () => "success";
const errorMsg = () => "error";
const resolveTask = () => new Promise(resolve => resolve({}));

describe("Cmd", () => {
    describe("none", () => {
        it("returns an empty array", () => {
            expect(cmd.none).toHaveLength(0);
        });
    });

    describe("batch", () => {
        it("keeps the order", () => {
            // arrange
            const dispatch = jest.fn();
            // act
            const batch = cmd.batch(cmd.ofMsg(successMsg()), cmd.ofMsg(errorMsg()));

            batch.forEach(b => b(dispatch));

            // assert
            expect(batch).toHaveLength(2);
            expect(dispatch).nthCalledWith(1, "success");
            expect(dispatch).nthCalledWith(2, "error");
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
                result[0](() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("dispatches the success message", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.either(task, successMsg, errorMsg);

                // act
                let message = "";

                result[0](msg => message = msg);

                // assert
                expect(message).toBe("success");
            });

            it("dispatches the error message", () => {
                // arrange
                const task = jest.fn(() => { throw new Error("error"); });
                const result = cmd.ofFunc.either(task, successMsg, errorMsg);

                // act
                let message = "";

                result[0](msg => message = msg);

                // assert
                expect(message).toBe("error");
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
                result[0](() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("dispatches the success message", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.perform(task, successMsg);

                // act
                let message = "";

                result[0](msg => message = msg);

                // assert
                expect(message).toBe("success");
            });

            it("ignores an error", () => {
                // arrange
                const task = jest.fn(() => { throw new Error("error"); });
                const result = cmd.ofFunc.perform(task, successMsg);

                // act
                let message = "";

                result[0](msg => message = msg);

                // assert
                expect(message).toBe("");
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
                result[0](() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("ignores the success", () => {
                // arrange
                const task = jest.fn();
                const result = cmd.ofFunc.attempt(task, errorMsg);

                // act
                let message = "";

                result[0](msg => message = msg);

                // assert
                expect(message).toBe("");
            });

            it("dispatches the error message", () => {
                // arrange
                const task = jest.fn(() => { throw new Error("error"); });
                const result = cmd.ofFunc.attempt(task, errorMsg);

                // act
                let message = "";

                result[0](msg => message = msg);

                // assert
                expect(message).toBe("error");
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
                result[0](() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("dispatches the success message", async done => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.either(task, successMsg, errorMsg);

                // act
                const act = async () => {
                    return new Promise(resolve => {
                        result[0](resolve);
                    });
                };
                const message = await act();

                // assert
                expect(message).toBe("success");
                done();
            });

            it("dispatches the error message", async done => {
                // arrange
                const task = jest.fn(() => new Promise((_, reject) => reject("error")));
                const result = cmd.ofPromise.either(task, successMsg, errorMsg);

                // act
                const act = (async () => {
                    return new Promise(resolve => {
                        result[0](resolve);
                    });
                });
                const message = await act();

                // assert
                expect(message).toBe("error");
                done();
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
                result[0](() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("dispatches the success message", async done => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.perform(task, successMsg);

                // act
                const act = async () => {
                    return new Promise(resolve => {
                        result[0](resolve);
                    });
                };
                const message = await act();

                // assert
                expect(message).toBe("success");
                done();
            });

            it("ignores an error", async done => {
                // arrange
                const task = jest.fn(() => new Promise((_, reject) => reject("error")));
                const result = cmd.ofPromise.perform(task, successMsg);

                // act
                result[0](jest.fn());

                // assert
                done();
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
                result[0](() => null);

                // assert
                expect(task).toHaveBeenCalledTimes(1);
            });

            it("ignores the success", async done => {
                // arrange
                const task = jest.fn(resolveTask);
                const result = cmd.ofPromise.attempt(task, errorMsg);

                // act
                result[0](jest.fn());

                // assert
                done();
            });

            it("dispatches the error message", async done => {
                // arrange
                const task = jest.fn(() => new Promise((_, reject) => reject("error")));
                const result = cmd.ofPromise.attempt(task, errorMsg);

                // act
                const act = (async () => {
                    return new Promise(resolve => {
                        result[0](resolve);
                    });
                });
                const message = await act();

                // assert
                expect(message).toBe("error");
                done();
            });
        });
    });
});