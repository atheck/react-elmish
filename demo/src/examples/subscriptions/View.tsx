import { useElmish } from "react-elmish";
import { dispose, init, subscription, update } from "./App";

export function SubscriptionsApp(): React.JSX.Element {
	const [model] = useElmish({ name: "Subscriptions", props: {}, init, update, subscription, dispose });

	return (
		<div className={"example"}>
			<p className={"value"}>{model.now.toLocaleTimeString()}</p>
			<p className={"hint"}>
				{
					"Ticks every second via a subscription. Switch to another example and check the browser console to see the dispose cleanup log."
				}
			</p>
		</div>
	);
}
