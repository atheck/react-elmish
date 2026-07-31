import { ElmComponent } from "react-elmish";
import { init, type Message, type Model, Msg, type Props, update } from "./App";

class ClassCounter extends ElmComponent<Model, Message, Props> {
	public constructor(props: Props) {
		super(props, init, "ClassCounter");
	}

	public update = update;

	public override render(): React.ReactNode {
		const { value } = this.model;

		return (
			<div className={"example"}>
				<p className={"value"}>{value}</p>
				<button type={"button"} onClick={() => this.dispatch(Msg.decrement())}>
					{"Decrement"}
				</button>
				<button type={"button"} onClick={() => this.dispatch(Msg.increment())}>
					{"Increment"}
				</button>
			</div>
		);
	}
}

export function ClassCounterApp(): React.JSX.Element {
	return <ClassCounter initialValue={0} />;
}
