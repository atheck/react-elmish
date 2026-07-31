import { useElmish } from "react-elmish";
import { init, Msg, update } from "./App";

export function AsyncCmdApp(): React.JSX.Element {
	const [model, dispatch] = useElmish({ name: "AsyncCmd", props: {}, init, update });

	return (
		<div className={"example"}>
			<button type={"button"} onClick={() => dispatch(Msg.load())} disabled={model.status === "loading"}>
				{model.status === "loading" ? "Loading…" : "Load a quote"}
			</button>
			{model.status === "loaded" && <p className={"value"}>{model.quote}</p>}
			{model.status === "error" && <p className={"value"}>{`Error: ${model.errorMessage}`}</p>}
		</div>
	);
}
