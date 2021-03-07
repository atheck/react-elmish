import { Cmd } from "../Cmd";

export const runSingleOfPromiseCmd = async <TMsg>(cmd: Cmd<TMsg>): Promise<void> => {
    return new Promise<void>((resolve) => {
        const dispatch = () => resolve();

        cmd[0](dispatch);
    });
};

export const getOfMsgParams = <TMsg>(cmd?: Cmd<TMsg>): TMsg [] => {
    const msgNames: TMsg [] = [];

    const dispatch = (msg: TMsg) => msgNames.push(msg);

    cmd?.map(c => c(dispatch));

    return msgNames;
};