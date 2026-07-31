import { useState } from "react";
import { MessageLog } from "./components/MessageLog";
import { AsyncCmdApp } from "./examples/async-cmd/View";
import { BasicCounterApp } from "./examples/basic-counter/View";
import { ClassCounterApp } from "./examples/class-counter/View";
import { CompositionApp } from "./examples/composition/View";
import { ImmutableCounterApp } from "./examples/immutable-counter/View";
import { SubscriptionsApp } from "./examples/subscriptions/View";
import { messageLog } from "./messageLog";

interface Example {
	id: string;
	title: string;
	description: string;
	component: React.ComponentType;
}

const examples: Example[] = [
	{
		id: "basic",
		title: "Basic useElmish counter",
		description: "A function component using the useElmish hook and an UpdateMap.",
		component: BasicCounterApp,
	},
	{
		id: "class",
		title: "ElmComponent class counter",
		description: "The same counter written as a class component extending ElmComponent.",
		component: ClassCounterApp,
	},
	{
		id: "immutable",
		title: "Immutable (Immer) counter",
		description: "Using react-elmish/immutable, update handlers mutate an Immer draft directly.",
		component: ImmutableCounterApp,
	},
	{
		id: "async",
		title: "Async cmd",
		description: "Dispatching a command that calls an async function via cmd.ofEither, with error handling.",
		component: AsyncCmdApp,
	},
	{
		id: "subscriptions",
		title: "Subscriptions",
		description: "A ticking clock driven by a subscription, with a dispose function that cleans up on unmount.",
		component: SubscriptionsApp,
	},
	{
		id: "composition",
		title: "Composition",
		description: "Composing a reusable LoadSettings module into a parent UpdateMap, overriding a handler via defer + callBase.",
		component: CompositionApp,
	},
];

export function App(): React.JSX.Element {
	const [activeId, setActiveId] = useState(examples[0]?.id);
	const activeExample = examples.find((example) => example.id === activeId) ?? examples[0];

	function selectExample(id: string): void {
		setActiveId(id);
		messageLog.clear();
	}

	return (
		<div className={"layout"}>
			<nav className={"sidebar"}>
				<h1>{"react-elmish"}</h1>
				<p>{"Live examples of the Elm architecture for React."}</p>
				<a className={"repo-link"} href={"https://github.com/atheck/react-elmish"}>
					{"View on GitHub"}
				</a>
				<ul className={"nav"}>
					{examples.map((example) => (
						<li key={example.id}>
							<button
								type={"button"}
								aria-current={example.id === activeId ? "page" : undefined}
								onClick={() => selectExample(example.id)}
							>
								{example.title}
							</button>
						</li>
					))}
				</ul>
			</nav>
			<main className={"content"}>
				{activeExample && (
					<>
						<h2>{activeExample.title}</h2>
						<p>{activeExample.description}</p>
						<activeExample.component />
						<MessageLog />
					</>
				)}
			</main>
		</div>
	);
}
