import { execCmd } from "../src/Testing";
import { createCmd } from "../src/Cmd";

type Message =
    | { name: "Msg1" }
    | { name: "Msg2" }
    | { name: "Error" }
    ;

const cmd = createCmd<Message>();

describe("Testing", () => {
    describe("execCmd", () => {
        it("returns an empty array without a cmd", async () => {
            // act
            const messages = await execCmd();

            // assert
            expect(messages).toEqual([]);
        });

        it("executes all message commands", async () => {
            // arrange
            const cmds = cmd.batch(cmd.ofMsg({ name: "Msg1" }), cmd.ofMsg({ name: "Msg2" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Msg1" }, { name: "Msg2" }]);
        });

        it("executes all ofFunc commands", async () => {
            // arrange
            const func = (): void => {
                return;
            };

            const cmds = cmd.batch(cmd.ofFunc.either(func, () => ({ name: "Msg1" }), () => ({ name: "Error"})), cmd.ofMsg({ name: "Msg2" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Msg1" }, { name: "Msg2" }]);
        });

        it("executes all ofFunc commands, fail", async () => {
            // arrange
            const func = (): void => {
                throw Error();
            };

            const cmds = cmd.batch(cmd.ofFunc.either(func, () => ({ name: "Msg1" }), () => ({ name: "Error"})), cmd.ofMsg({ name: "Msg2" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Error" }, { name: "Msg2" }]);
        });

        it("executes all ofPromise commands", async () => {
            // arrange
            const asyncFunc = (): Promise<void> => {
                return Promise.resolve();
            };

            const cmds = cmd.batch(cmd.ofPromise.either(asyncFunc, () => ({ name: "Msg1" }), () => ({ name: "Error"})), cmd.ofMsg({ name: "Msg2" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Msg1" }, { name: "Msg2" }]);
        });

        it("executes all ofPromise commands, fail", async () => {
            // arrange
            const asyncFunc = (): Promise<void> => {
                return Promise.reject();
            };

            const cmds = cmd.batch(cmd.ofPromise.either(asyncFunc, () => ({ name: "Msg1" }), () => ({ name: "Error"})), cmd.ofMsg({ name: "Msg2" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Error" }, { name: "Msg2" }]);
        });

        it("resolves for async attempt", async () => {
            // arrange
            const asyncFunc = (): Promise<void> => {
                return Promise.resolve();
            };

            const cmds = cmd.ofPromise.attempt(asyncFunc, () => ({ name: "Error" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([null]);
        });

        it("resolves for async attempt, fail", async () => {
            // arrange
            const asyncFunc = (): Promise<void> => {
                return Promise.reject();
            };

            const cmds = cmd.ofPromise.attempt(asyncFunc, () => ({ name: "Error" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Error" }]);
        });

        it("resolves for async perform", async () => {
            // arrange
            const asyncFunc = (): Promise<void> => {
                return Promise.resolve();
            };

            const cmds = cmd.ofPromise.perform(asyncFunc, () => ({ name: "Msg1" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Msg1" }]);
        });

        it("rejects for async perform, fail", async () => {
            // arrange
            const asyncFunc = (): Promise<void> => {
                return Promise.reject(Error("fail"));
            };

            const cmds = cmd.ofPromise.perform(asyncFunc, () => ({ name: "Msg1" }));

            // act
            const fail = async () => await execCmd(cmds);

            // assert
            expect(fail()).rejects.toStrictEqual(Error("fail"));
        });

        it("resolves for attempt", async () => {
            // arrange
            const func = (): void => {
                return;
            };

            const cmds = cmd.ofFunc.attempt(func, () => ({ name: "Error" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([null]);
        });

        it("resolves for attempt, fail", async () => {
            // arrange
            const func = (): void => {
                throw Error("fail");
            };

            const cmds = cmd.ofFunc.attempt(func, () => ({ name: "Error" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Error" }]);
        });

        it("resolves for async perform", async () => {
            // arrange
            const func = (): void => {
                return;
            };

            const cmds = cmd.ofFunc.perform(func, () => ({ name: "Msg1" }));

            // act
            const messages = await execCmd(cmds);

            // assert
            expect(messages).toEqual([{ name: "Msg1" }]);
        });

        it("rejects for async perform, fail", async () => {
            // arrange
            const func = (): void => {
                throw Error("fail");
            };

            const cmds = cmd.ofFunc.perform(func, () => ({ name: "Msg1" }));

            // act
            const fail = async () => await execCmd(cmds);

            // assert
            expect(fail()).rejects.toStrictEqual(Error("fail"));
        });
    });
});