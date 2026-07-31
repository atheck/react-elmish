import { useSyncExternalStore } from "react";
import { messageLog } from "../messageLog";

export function MessageLog(): React.JSX.Element {
	const entries = useSyncExternalStore(messageLog.subscribe, messageLog.getSnapshot);

	return (
		<div className={"message-log"}>
			<div className={"message-log-header"}>
				<h3>{"Dispatched messages"}</h3>
				<button type={"button"} onClick={() => messageLog.clear()} disabled={entries.length === 0}>
					{"Clear"}
				</button>
			</div>
			{entries.length === 0 ? (
				<p className={"message-log-empty"}>{"No messages dispatched yet. Interact with the example above."}</p>
			) : (
				<ul className={"message-log-list"}>
					{entries.map((entry) => (
						<li key={entry.id}>
							<span className={"message-log-name"}>{entry.name}</span>
							{Object.keys(entry.payload).length > 0 && (
								<pre className={"message-log-payload"}>{JSON.stringify(entry.payload)}</pre>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
