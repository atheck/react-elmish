import { execCmd, runSingleOfPromiseCmd } from "../src/Testing";
import { createCmd } from "../src/Cmd";

type Message =
    | { name: "Msg1" }
    | { name: "Msg2" }
    | { name: "Error" }
    ;

const cmd = createCmd<Message>();

describe("Testing", () => {
    describe("execCmd", () => {
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
    });
});