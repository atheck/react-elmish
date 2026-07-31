import { useElmish } from "react-elmish/immutable";
import { init, Msg, update } from "./App";

export function ImmutableCounterApp(): React.JSX.Element {
	const [model, dispatch] = useElmish({ name: "ImmutableCounter", props: { initialValue: 0 }, init, update });

	return (
		<div className={"example"}>
			<p className={"value"}>{model.value}</p>
			<button type={"button"} onClick={() => dispatch(Msg.decrement())}>
				{"Decrement"}
			</button>
			<button type={"button"} onClick={() => dispatch(Msg.increment())}>
				{"Increment"}
			</button>
		</div>
	);
}
