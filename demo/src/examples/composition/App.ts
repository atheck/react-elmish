import { cmd, type InitResult, type UpdateMap, type UpdateReturnType } from "react-elmish";
import {
	type Message as LoadSettingsMessage,
	type Model as LoadSettingsModel,
	init as loadSettingsInit,
	Msg as loadSettingsMsg,
	update as loadSettingsUpdate,
} from "./LoadSettings";

type Props = Record<string, never>;

type Message = { name: "reload" } | LoadSettingsMessage;

const Msg = {
	reload: (): Message => ({ name: "reload" }),
	...loadSettingsMsg,
};

interface Model extends LoadSettingsModel {
	reloadCount: number;
}

function init(): InitResult<Model, Message> {
	return [{ ...loadSettingsInit(), reloadCount: 0 }, cmd.ofMsg(Msg.loadSettings())];
}

const update: UpdateMap<Props, Model, Message> = {
	reload(): UpdateReturnType<Model, Message> {
		return [{}, cmd.ofMsg(Msg.loadSettings())];
	},

	...loadSettingsUpdate,

	// Overwrite the LoadSettings handler to additionally count how often settings were loaded,
	// while still running the original handler via defer + callBase.
	settingsLoaded(_msg, model, _props, { defer, callBase }): UpdateReturnType<Model, Message> {
		defer(...callBase(loadSettingsUpdate.settingsLoaded));

		return [{ reloadCount: model.reloadCount + 1 }];
	},
};

export type { Message, Model };

export { init, Msg, update };
