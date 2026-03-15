const noopMessageName = "__react_elmish_noop__" as const;

interface NoopMessage {
	readonly name: typeof noopMessageName;
}

function noop(): NoopMessage {
	return { name: noopMessageName };
}

function isNoop(msg: { name: string }): msg is NoopMessage {
	return msg.name === noopMessageName;
}

export type { NoopMessage };

export { isNoop, noop, noopMessageName };
