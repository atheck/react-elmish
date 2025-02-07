interface ReduxDevToolsExtension {
	connect: (options?: ReduxOptions) => ReduxDevTools;
	disconnect: () => void;
}

interface ReduxOptions {
	name?: string;
}

interface ReduxDevTools {
	init: (state: unknown) => void;
	send: (message: string, state: unknown, options?: ReduxOptions) => void;
	subscribe: <TState>(callback: (message: ReduxMessage<TState>) => void) => () => void;
}

interface ReduxMessage<TState> {
	type: string;
	payload: {
		type: string;
	};
	state: TState;
}

interface ReduxDevToolsExtensionWindow extends Window {
	// biome-ignore lint/style/useNamingConvention: Predefined
	__REDUX_DEVTOOLS_EXTENSION__: ReduxDevToolsExtension;
}

declare global {
	interface Window {
		// biome-ignore lint/style/useNamingConvention: Predefined
		__REDUX_DEVTOOLS_EXTENSION__?: ReduxDevToolsExtension;
	}
}

function isReduxDevToolsEnabled(window: Window | undefined): window is ReduxDevToolsExtensionWindow {
	return window !== undefined && "__REDUX_DEVTOOLS_EXTENSION__" in window;
}

export type { ReduxDevTools, ReduxDevToolsExtension };

export { isReduxDevToolsEnabled };
