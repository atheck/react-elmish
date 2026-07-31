import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { init } from "react-elmish";
import { App } from "./App";
import "./index.css";
import { messageLog } from "./messageLog";

init({
	dispatchMiddleware: (msg) => messageLog.push(msg),
});

const rootElement = document.querySelector("#root");

if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
