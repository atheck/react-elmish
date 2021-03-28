# react-elmish

This library brings the elmish pattern to react.

## Installation

`npm install react-elmish`

## Basic Usage

An elmish component basically consists of the following parts:

* The **Model** holding the state of the component.
* The **Props** for the component.
* The **Init** function to create the initial model based on the props.
* The **Messages** to dispatch which modify the model.
* The **Update** function to modify the model based on a specific message.
* The **View** which renders the component based on the current model.

## App.ts

First import everything from `react-elmish` and declare the **Message** discriminated union type:

```ts
import * as Elm from "react-elmish";

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

To create the initial model we need an **init** function:

```ts
export const init = (props: Props): [Model, Elm.Cmd<Message>] => {
    const model: Model = {
        value: props.initialValue,
    };

    return [model, cmd.none];
};
```

To update the model based on a message we need an **update** function:

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

> **Note:** If you are using **typescript** and **typescript-eslint** you should enable the [switch-exhaustive-check](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/switch-exhaustiveness-check.md) rule.

### App.tsx

To put all this together and to render our component, we need a React class component:

```tsx
// Import everything from the App.ts
import * as Shared from "../App";
// Import the ElmComponent which extends the React.Component
import { ElmComponent } from "react-elmish";
// Don't forget to import react
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

> **Note**: It is recommended to separate business logic and the view into separate modules. Here we put the `Messages`, `Model`, `Props`, `init`, and `update` functions into **App.ts**. The elmish React Component resides in a **Components** subfolder and is named **App.tsx**.
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

## Setup

**react-elmish** works without a setup. But if you want to use logging or some error handling middleware, you can setup **react-elmish** at the start of your program.

```ts
import * as Elm from "react-elmish";

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

1. Optionally add the convenient function to the **Msg** object:

    ```ts
    export const Msg = {
        ...
        error: (error: Error): Message => ({ name: "Error", error }),
    }
    ```

1. Handle the error message in the **update** function:

    ```ts
    ...
    case "Error":
        return Elm.handleError(msg.error);
    ...
    ```

The **handleError** function then calls your error handling middleware.

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
| `cmd.ofFunc.attempt` | Like `either` but ignores the success case.  |
| `cmd.ofFunc.perform` | Like `either` but ignores the error case.  |
| `cmd.ofPromise.either` | Calls an async function and maps the result into a message. |
| `cmd.ofPromise.attempt` | Like `either` but ignores the success case. |
| `cmd.ofPromise.perform` | Like `either` but ignores the error case. |

So, for an async function like:

```ts
const loadSettings = async (arg1: string, arg2: number): Promise<Settings> => {
    const settings = await Storage.loadSettings();
    return settings;
}
```

you can define the following messages:

```ts
export type Messages =
    ...
    | { name: "LoadSettings" },
    | { name: "SettingsLoaded", settings: Settings }
    | { name: "Error", error: Error }
    ...

export const Msg = {
    ...
    loadSettings: (): Message => ({ name: "LoadSettings" }),
    settingsLoaded: (settings: Settings): Message => ({ name: "SettingsLoaded", settings }),
    error: (error: Error): Message => ({ name: "Error", error }),
    ...
};
```

and handle the messages in the **update** function:

```ts
...
case "LoadSettings":
    // Create a command out of the async function with the provided arguments
    // If loadSettings resolves it dispatches "SettingsLoaded"
    // If it fails it dispatches "Error"
    // The return type of loadSettings must fit Msg.settingsLoaded
    return [{}, cmd.ofPromise.either(loadSettings, Msg.settingsLoaded, Msg.error, "firstArg", 123)];

case "SettingsLoaded":
    return [{ settings: msg.settings }];

case "Error":
    return Elm.handleError(msg.error);
...
```

## React life cycle management

If you want to use `componentDidMount` or `componentWillUnmount` don't forget to call the base class implementation of it as the **ElmComponent** is using them internally.

```ts
class App extends ElmComponent<Shared.Model, Shared.Message, Shared.Props> {
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

## Composition

If you have some business logic that you want to reuse in other components, you can do this by using different sources for messages.

Let's say you want to load some settings, you can write a module like this:

```ts LoadSettings.ts
import * as Elm from "react-elmish";

export type Settings = {
    // ...
};

// We use a MsgSource to differentiate between the messages
type MessageSource = Elm.MsgSource<"LoadSettings">;

// Add that MessageSource to all the messages
export type Message =
    | { name: "LoadSettings" } & MessageSource
    | { name: "SettingsLoaded", settings: Settings } & MessageSource
    | { name: "Error", error: Error } & MessageSource

// Do the same for the convenient functions
const MsgSource: MessageSource = { source: "LoadSettings" };

export const Msg = {
    loadSettings: (): Message => ({ name: "LoadSettings", ...MsgSource }),
    settingsLoaded: (settings: Settings): Message => ({ name: "SettingsLoaded", settings, ...MsgSource }),
    error: (error: Error): Message => ({ name: "Error", error, ...MsgSource }),
};

const cmd = Elm.createCmd<Message>();

export type Model = Readonly<{
    settings: Nullable<Settings>,
}>;

export const init = (): Model => ({
    settings: null,
});

export const update = (_model: Model, msg: Message): Elm.UpdateReturnType<Model, Message> => {
    switch (msg.name) {
        case "LoadSettings":
            return [{}, cmd.ofPromise.either(loadSettings, Msg.settingsLoaded, Msg.error)];

        case "SettingsLoaded":
            return [{ settings: msg.settings }];

        case "Error":
            return Elm.handleError(msg.error);
    }
};

const loadSettings = async (): Promise<Settings> => {
    // Call some service (e.g. database or backend)
    return Promise.resolve({});
};
```

> **Note**: This module has no **View**.

In other components where we want to use this **LoadSettings** module, we also need a message source:

```ts Composition.ts
import * as Elm from "react-elmish";
// Import the LoadSettings module
import * as LoadSettings from "./LoadSettings";

// Create a message source for this module
type MessageSource = Elm.MsgSource<"Composition">;

// Here we define our local messages
// We don't need to export them
type CompositionMessage =
    | { name: "MyMessage" } & MessageSource
    ;

// Combine the local messages and the ones from LoadSettings
export type Message =
    | CompositionMessage
    | LoadSettings.Message
    ;

const MsgSource: MessageSource = { source: "Composition" };

export const Msg = {
    // Spread the convenient functions
    ...LoadSettings.Msg,
    myMessage: (): Message => ({ name: "MyMessage", ...MsgSource }),
};

const cmd = Elm.createCmd<Message>();

// Include the LoadSettings Model
export type Model = Readonly<{
    // ...
}> & LoadSettings.Model;

export const init = (): [Model, Elm.Cmd<Message>] => {
    const model: Model = {
        // Spread the initial model from LoadSettings
        ...LoadSettings.init(),
        // ...
    };

    // Return the model and dispatch the LoadSettings message
    return [model, cmd.ofMsg(LoadSettings.Msg.loadSettings())];
};

// In our update function, we first distinguish between the sources of the messages
export const update = (model: Model, msg: Message): Elm.UpdateReturnType<Model, Message> => {
    switch (msg.source) {
        case "Composition":
            // Then call the update function for the local messages
            return updateComposition(model, msg);

        case "LoadSettings":
            // Or call the update function for the LoadSettings messages
            return LoadSettings.update(model, msg);
    }
}

// For the msg parameter we use the local CompositionMessage type
const updateComposition = (model: Model, msg: CompositionMessage): Elm.UpdateReturnType<Model, Message> => {
    switch (msg.name) {
        case "MyMessage":
            return [{}];
    }
}
```

## Call back parent components

Since each component has its own model and messages, communication with parent components is done via callback functions.

To inform the parent component about some action, let's say to close a dialog form, you do the following:

1. Create a message

    ```ts Dialog.ts
    export type Message =
        ...
        | { name: "Close" }
        ...

    export const Msg = {
        ...
        close: (): Message => ({ name: "Close" }),
        ...
    }
    ```

1. Define a callback function property in the **Props**:

    ```ts Dialog.ts
    export type Props = {
        onClose: () => void,
    };
    ```

1. Handle the message and call the callback function:

    ```ts Dialog.ts
    ...
    case "Close":
        props.onClose();
        return [{}];
    ...
    ```

1. In the **render** method of the parent component pass the callback as prop

    ```tsx Parent.tsx
    ...
    <Dialog onClose={() => this.dispatch(Msg.closeDialog())}>
    ...
    ```

## Testing

To test your **update** function you can use some helper functions in `react-elmish/dist/Testing`:

| Function | Description |
| --- | --- |
| `getOfMsgParams` | Extracts the messages out of a command |
| `runSingleOfPromiseCmd` | Executes a single command created with one of the `ofPromise`-functions. |
| ... more to come |

### Testing the model and simple message commands

```ts
import * as Testing from "react-elmish/dist/Testing";

...
it("returns the correct model and cmd", () => {
    // arrange
    const model = // create model for test
    const props = // create props for test
    const msg = Shared.Msg.test();

    const expectedValue = // what you expect in the model
    const expectedCmds = [
        Shared.Msg.expectedMsg1("arg"),
        Shared.Msg.expectedMsg2(),
    ];

    // act
    const [newModel, cmd] = Shared.update(model, msg, props);

    // assert
    expect(newModel.value).toEqual(expectedValue);
    expect(Testing.getOfMsgParams(cmd)).toEqual(expectedCmds);
});
...
```

### Testing async function commands

```ts
import * as Testing from "react-elmish/dist/Testing";

...
it("returns the correct cmd", () => {
    // arrange
    const model = // create model for test
    const props = // create props for test
    const msg = Shared.Msg.asyncTest();

    const functionMock = // some mocked function which should be called when the "AsyncTest" messages is handled

    // act
    const [, cmd] = Shared.update(model, msg, props);

    // assert
    cmd && await Testing.runSingleOfPromiseCmd(cmd);
    expect(functionMock).toBeCalled();
});
...
```
