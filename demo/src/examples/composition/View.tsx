import { useElmish } from "react-elmish";
import { init, Msg, update } from "./App";

export function CompositionApp(): React.JSX.Element {
	const [model, dispatch] = useElmish({ name: "Composition", props: {}, init, update });

	return (
		<div className={"example"}>
			<p className={"hint"}>{`Settings were loaded via composition ${model.reloadCount} time(s).`}</p>
			{model.status === "loading" && <p className={"value"}>{"Loading settings…"}</p>}
			{model.status === "loaded" && model.settings && (
				<p className={"value"}>{`Theme: ${model.settings.theme}, notifications: ${
					model.settings.notifications ? "on" : "off"
				}`}</p>
			)}
			{model.status === "error" && <p className={"value"}>{"Failed to load settings."}</p>}
			<button type={"button"} onClick={() => dispatch(Msg.reload())} disabled={model.status === "loading"}>
				{"Reload settings"}
			</button>
		</div>
	);
}
