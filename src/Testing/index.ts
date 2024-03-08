import type { RenderWithModelOptions } from "../fakeOptions";
import { createModelAndProps } from "./createModelAndProps";
import { createUpdateArgsFactory, type ModelAndPropsFactory, type UpdateArgsFactory } from "./createUpdateArgsFactory";
import { execCmd } from "./execCmd";
import { execSubscription } from "./execSubscription";
import { getCreateModelAndProps, getCreateUpdateArgs } from "./getCreateUpdateArgs";
import { getUpdateAndExecCmdFn, getUpdateFn } from "./getUpdateFn";
import { initAndExecCmd } from "./initAndExecCmd";
import { renderWithModel } from "./renderWithModel";

export type { ModelAndPropsFactory, RenderWithModelOptions, UpdateArgsFactory };

export {
	createModelAndProps,
	createUpdateArgsFactory,
	execCmd,
	execSubscription,
	getCreateModelAndProps,
	getCreateUpdateArgs,
	getUpdateAndExecCmdFn,
	getUpdateFn,
	initAndExecCmd,
	renderWithModel,
};
