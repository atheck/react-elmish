import {
	cmd,
	type ErrorMessage,
	errorMsg,
	handleError,
	type InitResult,
	type UpdateMap,
	type UpdateReturnType,
} from "react-elmish";

interface Model {
	status: "idle" | "loading" | "loaded" | "error";
	quote?: string;
	errorMessage?: string;
}

type Props = Record<string, never>;

type Message = { name: "load" } | { name: "loaded"; quote: string } | ErrorMessage;

const Msg = {
	load: (): Message => ({ name: "load" }),
	loaded: (quote: string): Message => ({ name: "loaded", quote }),
	...errorMsg,
};

const quotes = [
	"Elm gives me the confidence to refactor without fear.",
	"The best code is the code you don't have to debug at 2am.",
	"A message, an update, a model — that's the whole story.",
	"No exceptions, no undefined is not a function, no cannot read property of undefined.",
	"Make impossible states impossible.",
	"The model is the single source of truth.",
	"A command is just a description of a side effect, not the side effect itself.",
	"Time-travel debugging is a side effect of a good architecture, not a feature you bolt on.",
	"Pure functions in, predictable UI out.",
	"If it compiles, it usually just works.",
];

async function fetchQuote(): Promise<string> {
	await new Promise((resolve) => {
		setTimeout(resolve, 800);
	});

	const quote = quotes[Math.floor(Math.random() * quotes.length)];

	if (!quote) {
		throw new Error("Failed to load a quote");
	}

	return quote;
}

function init(): InitResult<Model, Message> {
	return [{ status: "idle" }];
}

const update: UpdateMap<Props, Model, Message> = {
	load(): UpdateReturnType<Model, Message> {
		return [{ status: "loading" }, cmd.ofEither(fetchQuote, Msg.loaded, Msg.error)];
	},

	loaded(msg): UpdateReturnType<Model, Message> {
		return [{ status: "loaded", quote: msg.quote }];
	},

	error(msg): UpdateReturnType<Model, Message> {
		handleError(msg.error);

		return [{ status: "error", errorMessage: msg.error.message }];
	},
};

export type { Message, Model, Props };

export { init, Msg, update };
