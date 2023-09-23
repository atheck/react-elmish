import { RenderWithModelOptions } from "../fakeOptions";
import { createModelAndProps } from "./createModelAndProps";
import { ModelAndPropsFactory, UpdateArgsFactory, createUpdateArgsFactory } from "./createUpdateArgsFactory";
import { execCmd } from "./execCmd";
import { getCreateModelAndProps, getCreateUpdateArgs } from "./getCreateUpdateArgs";
import { getUpdateAndExecCmdFn, getUpdateFn } from "./getUpdateFn";
import { initAndExecCmd } from "./initAndExecCmd";
import { renderWithModel } from "./renderWithModel";

export type { ModelAndPropsFactory, RenderWithModelOptions, UpdateArgsFactory };

export {
	createModelAndProps,
	createUpdateArgsFactory,
	execCmd,
	getCreateModelAndProps,
	getCreateUpdateArgs,
	getUpdateAndExecCmdFn,
	getUpdateFn,
	initAndExecCmd,
	renderWithModel,
};
