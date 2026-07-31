import { useElmish } from "react-elmish";
import { init, Msg, update } from "./App";

export function BasicCounterApp(): React.JSX.Element {
	const [model, dispatch] = useElmish({ name: "BasicCounter", props: { initialValue: 0 }, init, update });

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
