import { Cmd, createCmd, Dispatch } from "./Cmd";
import { ElmComponent, UpdateReturnType } from "./ElmComponent";
import { handleError, MsgSource } from "./ElmUtilities";
import { ILogger, init, Logger, Message } from "./Init";
import { useElmish } from "./Hooks";

export type {
    // eslint-disable-next-line @delagen/deprecation/deprecation
    ILogger,
    Logger,
    Message,
    Cmd,
    Dispatch,
    UpdateReturnType,
    MsgSource,
};

export {
    init,
    createCmd,
    ElmComponent,
    handleError,
    useElmish,
};