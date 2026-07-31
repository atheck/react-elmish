import { cmd, type ErrorMessage, errorMsg, handleError, type UpdateMap, type UpdateReturnType } from "react-elmish";

interface Settings {
	theme: "light" | "dark";
	notifications: boolean;
}

type Props = Record<string, never>;

type Message = { name: "loadSettings" } | { name: "settingsLoaded"; settings: Settings } | ErrorMessage;

const Msg = {
	loadSettings: (): Message => ({ name: "loadSettings" }),
	settingsLoaded: (settings: Settings): Message => ({ name: "settingsLoaded", settings }),
	...errorMsg,
};

interface Model {
	settings: Settings | null;
	status: "idle" | "loading" | "loaded" | "error";
}

function init(): Model {
	return { settings: null, status: "idle" };
}

async function fetchSettings(): Promise<Settings> {
	await new Promise((resolve) => {
		setTimeout(resolve, 700);
	});

	return { theme: Math.random() > 0.5 ? "dark" : "light", notifications: Math.random() > 0.5 };
}

const update: UpdateMap<Props, Model, Message> = {
	loadSettings(): UpdateReturnType<Model, Message> {
		return [{ status: "loading" }, cmd.ofEither(fetchSettings, Msg.settingsLoaded, Msg.error)];
	},

	settingsLoaded(msg): UpdateReturnType<Model, Message> {
		return [{ status: "loaded", settings: msg.settings }];
	},

	error(msg): UpdateReturnType<Model, Message> {
		handleError(msg.error);

		return [{ status: "error" }];
	},
};

export type { Message, Model, Settings };

export { init, Msg, update };
