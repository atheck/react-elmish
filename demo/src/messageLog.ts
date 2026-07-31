import type { Message } from "react-elmish";

const maxEntries = 50;

interface LoggedMessage {
	id: number;
	name: string;
	payload: Record<string, unknown>;
}

interface MessageLog {
	push: (msg: Message) => void;
	clear: () => void;
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => LoggedMessage[];
}

function toSerializable(value: unknown): unknown {
	// eslint-disable-next-line unicorn/prefer-error-is-error -- Error.isError is too new to rely on for a public demo page.
	return value instanceof Error ? { name: value.name, message: value.message } : value;
}

function createMessageLog(): MessageLog {
	let entries: LoggedMessage[] = [];
	let nextId = 1;
	const listeners = new Set<() => void>();

	function notify(): void {
		// react-elmish can dispatch messages (and thus call push/clear) synchronously while React is
		// still rendering or committing another component (e.g. a command fired from `init`). Deferring
		// the listener notification to a microtask avoids "Cannot update a component while rendering a
		// different component" warnings from useSyncExternalStore subscribers such as MessageLog.
		queueMicrotask(() => {
			for (const listener of listeners) {
				listener();
			}
		});
	}

	function push(msg: Message): void {
		const payload: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(msg)) {
			if (key !== "name") {
				payload[key] = toSerializable(value);
			}
		}

		entries = [{ id: nextId++, name: msg.name, payload }, ...entries].slice(0, maxEntries);
		notify();
	}

	function clear(): void {
		entries = [];
		notify();
	}

	function subscribe(listener: () => void): () => void {
		listeners.add(listener);

		return () => {
			listeners.delete(listener);
		};
	}

	function getSnapshot(): LoggedMessage[] {
		return entries;
	}

	return { push, clear, subscribe, getSnapshot };
}

export type { LoggedMessage };

export const messageLog = createMessageLog();
