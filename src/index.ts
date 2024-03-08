import { ElmComponent } from "./ElmComponent";
import { errorHandler, errorMsg, handleError, type ErrorMessage } from "./ErrorHandling";
import { init, type ElmOptions, type Logger } from "./Init";
import type { Cmd, Dispatch, InitResult, Message, MsgSource, UpdateMap, UpdateReturnType } from "./Types";
import { cmd } from "./cmd";
import { useElmish, type SubscriptionResult, type UseElmishOptions } from "./useElmish";

export type {
	Cmd,
	Dispatch,
	ElmOptions,
	ErrorMessage,
	InitResult,
	Logger,
	Message,
	MsgSource,
	SubscriptionResult,
	UpdateMap,
	UpdateReturnType,
	UseElmishOptions,
};

export { ElmComponent, cmd, errorHandler, errorMsg, handleError, init, useElmish };
