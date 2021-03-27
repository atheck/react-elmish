# react-elm

This library brings the elmish pattern to react.

## Installation

`npm install react-elm`

## Basic Usage

An elmish component basically consists of the following parts:

* The **Model** holding the state of the component.
* The **Props** for the component.
* The **Init** function to create the initial model based on the props.
* The **Messages** to dispatch which modify the model.
* The **Update** function to modify the model based on a specific message.
* The **View** which renders the component based on the current model.

First import Elm and declare the message discriminated union type:

```ts
import * as Elm from "react-elm";

export type Message =
    | { name: "Increment" }
    | { name: "Decrement" }
    ;
```

You can also create some convenience functions to dispatch a message:

```ts
export const Msg = {
    increment: (): Message => ({ name: "Increment" }),
    decrement: (): Message => ({ name: "Decrement" }),
};
```

Now we can create a `cmd` object for our messages type:

```ts
const cmd = Elm.createCmd<Message>();
```

Next, declare the model:

```ts
export type Model = Readonly<{
    value: number,
}>;
```

The props are optional:

```ts
export type Props = {
    initialValue: number,
};
```

To create the initial model we need an init function:

```ts
export const init = (props: Props): [Model, Elm.Cmd<Message>] => {
    const model: Model = {
        value: props.initialValue,
    };

    return [model, cmd.none];
};
```

To update the model based on a message we need an update function:

```ts
export const update = (model: Model, msg: Msg, props: Props): Elm.UpdateReturnType<Model, Message> => {
    switch (msg.name) {
        case "Increment":
            return [{ value: model.value + 1 }];

        case "Decrement":
            return [{ value: model.value - 1 }];
    }
};
```

> **Hint:** If you are using typescript and eslint you can enable the [switch-exhaustive-check](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/switch-exhaustiveness-check.md) rule.

To put all this together and to render our component, we need a React class component:

```tsx
import * as Shared from "../App";
import React from "react";

// Create an elmish class component
class App extends ElmComponent<Shared.Model, Shared.Message, Shared.Props> {
    // Construct the component with the props and init function
    constructor(props: Shared.Props) {
        super(props, Shared.init, "App");
    }

    // Assign our update function to the component
    update = Shared.update;

    render(): React.ReactNode {
        // Access the model
        const { value } = this.model;

        return (
            <div>
                {/* Display our current value */}
                <p>{value}</p>

                {/* Dispatch messages */}
                <button onClick={() => this.dispatch(Shared.Msg.increment())}>Increment</button>
                <button onClick={() => this.dispatch(Shared.Msg.decrement())}>Decrement</button>
            </div>
        );
    }
```

This initializes our model, assigns the update function and renders our component. You can access the current model with `this.model`.

You can use this component like any other React component.

> **Hint**: It is recommended to separate business logic and the view into separate modules. Here we put the `Messages`, `Model`, `Props`, `init`, and `update` functions into **App.ts**. The elmish React Component resides in a **Components** subfolder and is named **App.tsx**.
>
> You can even split the contents of the **App.ts** into two files: **Types.ts** (`Message`, `Model`, and `Props`) and **State.ts** (`init` and `update`).

## More on messages

### Message arguments

Messages can also have arguments. You can modify the example above and pass an optional step value to the **Increment** message:

```ts
export type Message =
    | { name: "Increment", step?: number }
    ...

export const Msg = {
    increment: (step?: number): Message => ({ name: "Increment", step }),
    ...
}
```

Then use this argument in the **update** function:

```ts
...
case "Increment":
    return [{ value: model.value + (msg.step ?? 1)}]
...
```

In the **render** method you can add another button to increment the value by 10:

```tsx
...
<button onClick={() => this.dispatch(Shared.Msg.increment(10))}>Increment by 10</button>
...
```

### Symbols instead of strings

You can also use **Symbols** for the message type instead of strings:

1. Declare a Symbol for the message:

    ```ts
    const ResetMsg = Symbol("reset");
    ```

1. Use this Symbol as message name:

    ```ts
    export type Message =
        ...
        | { name: typeof ResetMsg }
        ...
    ```

1. Create the convenient function

    ```ts
    export const Msg = {
        ...
        reset: (): Message => ({ name: ResetMsg }),
        ...
    }
    ```

1. Handle the new message in the **update** function:

    ```ts
    ...
    case ResetMsg:
        return [{ value: 0 }];
    ...
    ```

## Dispatch commands in the update function

In addition to modifying the model, you can dispatch new commands in the **update** function.

To do so, you can call one of the functions in the `cmd` object.

Let's assume you have a message to display the description of the last called message:

```ts
{ name: "PrintLastMessage", message: string }

...

printLastMessage: (message: string): Message => ({ name: "PrintLastMessage", message }),
```

In the **update** function you can dispatch that message like this:

```ts
case "Increment":
    return [{ value: model.value + 1 }, cmd.ofMsg(Msg.printLastMessage("Incremented by one"))];
```

This new message will immediately be dispatched after returning from the **update** function.

This way you can also call functions and async operations with one of the following functions:

| Function | Description |
|---|---|
| `cmd.none` | Does nothing. Equivalent to omit the second value. |
| `cmd.ofMsg` | Dispatches a new message. |
| `cmd.batch` | Aggregates an array of messages. |
| `cmd.ofFunc.either` | Calls a synchronous function and maps the result into a message. |
| `cmd.ofPromise.either` | Calls an async function and maps the result into a message. |
| `cmd.ofPromise.attempt` | Like `either` but ignores the success case. |
| `cmd.ofPromise.perform` | Like `either` but ignores the error case. |

Example: TODO

## Setup

**react-elm** works without a setup. But if you want to use logging or some error handling middleware, you can setup **react-elm** at the start of your program.

```ts
import * as Elm from "react-elm";

const myLogger = {
    debug(...args: unknown []) {
        console.debug(...args);
    },
    info(...args: unknown []) {
        console.info(...args);
    },
    error(...args: unknown []) {
        console.error(...args);
    },
}

Elm.init({
    logger: myLogger,
    errorMiddleware: error => Toast.error(error.message),
});
```

## Error handling

You can handle errors easily with the following pattern.

1. Add an error message:

    ```ts
    export type Message =
        | ...
        | { name: "Error", error: Error }
        ;
    ```

1. Optionally add the convenient function to the Msg object:

    ```ts
    export const Msg = {
        ...
        error: (error: Error): Message => ({ name: "Error", error }),
    }
    ```

1. Handle the error message in the update function:

    ```ts
    ...
    case "Error":
        return Elm.handleError(msg.error);
    ...
    ```

The **handleError** function then calls your error handling middleware.

## React life cycle management

If you want to use `componentDidMount` or `componentWillUnmount` don't forget to call the base class implementation of it as the ElmComponent is using them.

```ts
class App extends Elm.ElmComponent<Shared.Model, Shared.Message, Shared.Props> {
    ...
    componentDidMount() {
        super.componentDidMount();

        // your code
    }

    componentWillUnmount() {
        super.componentWillUnmount();

        // your code
    }
    ...
}
```

## Testing

TODO

## ToDo

* [ ] Support for functional components using hooks
