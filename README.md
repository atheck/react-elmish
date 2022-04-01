# react-elmish

![Build](https://github.com/atheck/react-elmish/actions/workflows/main.yml/badge.svg)
![npm](https://img.shields.io/npm/v/react-elmish)

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

### App.ts

First import everything from `react-elmish` and declare the **Message** discriminated union type:

```ts
import { Cmd, createCmd, InitResult, UpdateReturnType, UpdateMap } from "react-elmish";

export type Message =
    | { name: "increment" }
    | { name: "decrement" };
```

You can also create some convenience functions to create message objects:

```ts
export const Msg = {
    increment: (): Message => ({ name: "increment" }),
    decrement: (): Message => ({ name: "decrement" }),
};
```

Next, declare the model:

```ts
export interface Model {
    value: number,
}
```

The props are optional:

```ts
export interface Props {
    initialValue: number,
}
```

To create the initial model we need an **init** function:

```ts
export function init (props: Props): InitResult {
    return [
        {
            value: props.initialValue,
        }
    ];
};
```

To update the model based on a message we need an `UpdateMap` object:

```ts
export const update: UpdateMap<Props, Model, Message> = {
    increment (msg, model, props) {
        return [{ value: model.value + 1 }];
    },

    decrement (msg, model, props) {
        return [{ value: model.value - 1 }];
    },
};
```

**Note:** When using an `UpdateMap` it is recommended to use camelCase for message names ("increment" instead of "Increment").

Alternatively we can use an **update** function:

```ts
export const update = (model: Model, msg: Msg, props: Props): UpdateReturnType<Model, Message> => {
    switch (msg.name) {
        case "increment":
            return [{ value: model.value + 1 }];

        case "decrement":
            return [{ value: model.value - 1 }];
    }
};
```

> **Note:** If you are using **typescript** and **typescript-eslint** you should enable the [switch-exhaustive-check](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/switch-exhaustiveness-check.md) rule.

### App.tsx

To put all this together and to render our component, we need a React component.

As a **function component**:

```tsx
// Import everything from the App.ts
import { init, update, Msg, Props } from "../App";
// Import the useElmish hook
import { useElmish } from "react-elmish";

function App (props: Props): JSX.Element {
    // Call the useElmish hook, it returns the current model and the dispatch function
    const [model, dispatch] = useElmish({ props, init, update, name: "App" });

    return (
        <div>
            {/* Display our current value */}
            <p>{model.value}</p>

            {/* dispatch messages */}
            <button onClick={() => dispatch(Msg.increment())}>Increment</button>
            <button onClick={() => dispatch(Msg.decrement())}>Decrement</button>
        </div>
    );
}
```

As a **class component**:

```tsx
// Import everything from the App.ts
import { Model, Message, Props, init, update, Msg } as Shared from "../App";
// Import the ElmComponent which extends the React.Component
import { ElmComponent } from "react-elmish";
import React from "react";

// Create an elmish class component
class App extends ElmComponent<Model, Message, Props> {
    // Construct the component with the props and init function
    constructor(props: Props) {
        super(props, init, "App");
    }

    // Assign our update function to the component
    update = update;

    render(): React.ReactNode {
        // Access the model
        const { value } = this.model;

        return (
            <div>
                {/* Display our current value */}
                <p>{value}</p>

                {/* Dispatch messages */}
                <button onClick={() => this.dispatch(Msg.increment())}>Increment</button>
                <button onClick={() => this.dispatch(Msg.decrement())}>Decrement</button>
            </div>
        );
    }
```

You can use these components like any other React component.

> **Note**: It is recommended to separate business logic and the view into separate modules. Here we put the `Messages`, `Model`, `Props`, `init`, and `update` functions into **App.ts**. The elmish React Component resides in a **Components** subfolder and is named **App.tsx**.
>
> You can even split the contents of the **App.ts** into two files: **Types.ts** (`Message`, `Model`, and `Props`) and **State.ts** (`init` and `update`).

## More on messages

### Message arguments

Messages can also have arguments. You can modify the example above and pass an optional step value to the **Increment** message:

```ts
export type Message =
    | { name: "increment", step?: number }
    ...

export const Msg = {
    increment: (step?: number): Message => ({ name: "increment", step }),
    ...
}
```

Then use this argument in the **update** function:

```ts
...
case "increment":
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

## Dispatch commands in the update map or update function

In addition to modifying the model, you can dispatch new commands here.

To do so, you have to create a `cmd` object:

```ts
import { createCmd } from "react-elmish";

const cmd = createCmd<Message>();
```

Then you can call one of the functions of that object:

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
| `cmd.ofSub` | Use this function to trigger a command in a subscription. |

### Dispatch a message

Let's assume you have a message to display the description of the last called message:

```ts
export type Message =
    ...
    | { name: "printLastMessage", message: string }
    ...

export const Msg = {
    ...
    printLastMessage: (message: string): Message => ({ name: "printLastMessage", message }),
    ...
}

const cmd = createCmd<Message>();
```

In the **update** function you can dispatch that message like this:

```ts
case "increment":
    return [{ value: model.value + 1 }, cmd.ofMsg(Msg.printLastMessage("Incremented by one"))];
```

This new message will immediately be dispatched after returning from the **update**.

### Call an async function

This way you can also call functions and async operations. For an async function like:

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
    | { name: "loadSettings" },
    | { name: "settingsLoaded", settings: Settings }
    | ErrorMessage
    ...

export const Msg = {
    ...
    loadSettings: (): Message => ({ name: "loadSettings" }),
    settingsLoaded: (settings: Settings): Message => ({ name: "settingsLoaded", settings }),
    ...errorMsg,
    ...
};
```

and handle the messages in the **update** function:

```ts
...
case "loadSettings":
    // Create a command out of the async function with the provided arguments
    // If loadSettings resolves it dispatches "SettingsLoaded"
    // If it fails it dispatches "Error"
    // The return type of loadSettings must fit Msg.settingsLoaded
    return [{}, cmd.ofPromise.either(loadSettings, Msg.settingsLoaded, Msg.error, "firstArg", 123)];

case "settingsLoaded":
    return [{ settings: msg.settings }];

case "error":
    return handleError(msg.error);
...
```

### Dispatch a command from `init`

The same way as in the `update` map or function, you can also dispatch an initial command in the `init` function:

```ts
export function init (props: Props): InitResult {
    return [
        {
            value: props.initialValue,
        },
        cmd.ofMsg(Msg.loadData())
    ];
};
```

## Subscriptions

### Working with external sources of events

If you want to use external sources of events (e.g. a timer), you can use a `subscription`. With this those events can be processed by our `update` handler.

Let's define a `Model` and a `Message`:

```ts
type Message =
    | { name: "timer", date: Date };

interface Model {
    date: Date,
}

const Msg = {
    timer: (date: Date): Message => ({ name: "timer", date }),
};
```

Now we define the `init` function and the `update` object:

```ts
const cmd = createCmd<Message>();

function init (props: Props): InitResult<Model, Message> {
    return [{
        date: new Date(),
    }];
}

const update: UpdateMap<Props, Model, Message> = {
    timer ({ date }) {
        return [{ date }];
    },
};
```

Then we write our `subscription` function:

```ts
function subscription (model: Model): SubscriptionResult<Message> {
    const sub = (dispatch: Dispatch<Message>): void => {
        setInterval(() => dispatch(Msg.timer(new Date())), 1000) as unknown as number;
    }

    return [cmd.ofSub(sub)];
}
```

This function gets the initialized model as parameter and returns a command.

In the function component we call `useElmish` and pass the subscription to it:

```ts
const [{ date }] = useElmish({ name: "Subscriptions", props, init, update, subscription })
```

You can define and aggregate multiple subscriptions with a call to `cmd.batch(...)`.

### Cleanup subscriptions

In the solution above `setInterval` will trigger events even if the component is removed from the DOM. To cleanup subscriptions, we can return a `destructor` function from the subscription the same as in the `useEffect` hook.

Let's rewrite our `subscription` function:

```ts
function subscription (model: Model): SubscriptionResult<Message> {
    let timer: NodeJS.Timer;

    const sub = (dispatch: Dispatch<Message>): void => {
        timer = setInterval(() => dispatch(Msg.timer(new Date())), 1000);
    }

    const destructor = () => {
        clearInterval(timer1);
    }

    return [cmd.ofSub(sub), destructor];
}
```

Here we save the return value of `setInterval` and clear that interval in the returned `destructor` function.

## Setup

**react-elmish** works without a setup. But if you want to use logging or some middleware, you can setup **react-elmish** at the start of your program.

```ts
import { init } from "react-elmish";

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

init({
    logger: myLogger,
    errorMiddleware: error => Toast.error(error.message),
    dispatchMiddleware: msg => myLogger.debug(msg),
});
```

The error middleware function is called by the `handleError` function (see [Error handling](#error-handling)).

The dispatch middleware function is called whenever a Message is dispatched.

## Error handling

You can handle errors easily with the following pattern.

1. Add an error message:

    ```ts
    import { ErrorMessage, errorMsg, handleError } from "react-elmish";

    export type Message =
        | ...
        | ErrorMessage;
    ```

1. Optionally add the convenient function to the **Msg** object:

    ```ts
    export const Msg = {
        ...
        ...errorMsg,
    }
    ```

1. Handle the error message in the **update** function:

    ```ts
    ...
    case "error":
        return handleError(msg.error);
    ...
    ```

The **handleError** function then calls your error handling middleware.

## React life cycle management

If you want to use `componentDidMount` or `componentWillUnmount` in a class component, don't forget to call the base class implementation of it as the **ElmComponent** is using them internally.

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

In a functional component you can use the **useEffect** hook as normal.

## Composition

If you have some business logic that you want to reuse in other components, you can do this by using different sources for messages.

### With an `UpdateMap`

Let's say you want to load some settings, you can write a module like this:

```ts LoadSettings.ts
import { createCmd, Cmd, ErrorMessage, UpdateMap, handleError } from "react-elmish";

export interface Settings {
    // ...
}

export type Message =
    | { name: "loadSettings" }
    | { name: "settingsLoaded", settings: Settings }
    | ErrorMessage;

export const Msg = {
    loadSettings: (): Message => ({ name: "loadSettings" }),
    settingsLoaded: (settings: Settings): Message => ({ name: "settingsLoaded", settings }),
    error: (error: Error): Message => ({ name: "error", error }),
};

const cmd = createCmd<Message>();

export interface Model {
    settings: Settings | null,
}

export function init (): Model {
    return {
        settings: null
    };
}

export const update: UpdateMap<Props, Model, Message> = {
    loadSettings () {
        return [{}, cmd.ofPromise.either(loadSettings, Msg.settingsLoaded, Msg.error)];
    }

    settingsLoaded ({ settings }) {
        return [{ settings }];
    }

    error ({ error }) {
        return handleError(error);
    }
};

async function loadSettings (): Promise<Settings> {
    // Call some service (e.g. database or backend)
    return {};
}
```

> **Note**: This module has no **View**.

Now let's integrate the **LoadSettings** module in our component:

```ts Composition.ts
// Import the LoadSettings module
import * as LoadSettings from "./LoadSettings";
import { createCmd, Cmd, } from "react-elmish";

// Here we define our local messages
type Message =
    | { name: "myMessage" }
    | LoadSettings.Message;

// And spread the Msg of LoadSettings object
export const Msg = {
    myMessage: (): Message => ({ name: "myMessage" }),
    ...LoadSettings.Msg,
};

const cmd = Elm.createCmd<Message>();

interface Props {}

// Extend the LoadSettings model
interface Model extends LoadSettings.Model {
    // ...
}

export const init = (): [Model, Cmd<Message>] => {
    // Return the model and dispatch the LoadSettings message
    return [
        {
            // Spread the initial model from LoadSettings
            ...LoadSettings.init(),
            // ...
        },
        cmd.ofMsg(Msg.loadSettings())
    ];
};

// Spread the UpdateMap of LoadSettings into our update map
const update: UpdateMap<Props, Model, Message> = {
    myMessage () {
        return [{}];
    },

    ...LoadSettings.update,
};
```

## With an update function

Let's say you want to load some settings, you can write a module like this:

```ts LoadSettings.ts
import { MsgSource, ErrorMessage, createCmd, UpdateReturnType, handleError } from "react-elmish";

export type Settings = {
    // ...
};

// We use a MsgSource to differentiate between the messages
type MessageSource = MsgSource<"LoadSettings">;

// Add that MessageSource to all the messages
export type Message =
    | { name: "loadSettings" } & MessageSource
    | { name: "settingsLoaded", settings: Settings } & MessageSource
    | ErrorMessage & MessageSource

// Do the same for the convenient functions
const MsgSource: MessageSource = { source: "LoadSettings" };

export const Msg = {
    loadSettings: (): Message => ({ name: "loadSettings", ...MsgSource }),
    settingsLoaded: (settings: Settings): Message => ({ name: "settingsLoaded", settings, ...MsgSource }),
    error: (error: Error): Message => ({ name: "error", error, ...MsgSource }),
};

const cmd = createCmd<Message>();

export type Model = Readonly<{
    settings: Settings | null,
}>;

export const init = (): Model => ({
    settings: null,
});

export const update = (_model: Model, msg: Message): UpdateReturnType<Model, Message> => {
    switch (msg.name) {
        case "loadSettings":
            return [{}, cmd.ofPromise.either(loadSettings, Msg.settingsLoaded, Msg.error)];

        case "settingsLoaded":
            return [{ settings: msg.settings }];

        case "error":
            return handleError(msg.error);
    }
};

async function loadSettings (): Promise<Settings> {
    // Call some service (e.g. database or backend)
    return {};
}
```

> **Note**: This module has no **View**.

In other components where we want to use this **LoadSettings** module, we also need a message source:

```ts Composition.ts
import { createCmd, MsgSource, UpdateReturnType, Cmd } from "react-elmish";
// Import the LoadSettings module
import * as LoadSettings from "./LoadSettings";

// Create a message source for this module
type MessageSource = MsgSource<"Composition">;

// Here we define our local messages
// We don't need to export them
type CompositionMessage =
    | { name: "myMessage" } & MessageSource;

// Combine the local messages and the ones from LoadSettings
export type Message =
    | CompositionMessage
    | LoadSettings.Message;

const MsgSource: MessageSource = { source: "Composition" };

export const Msg = {
    myMessage: (): Message => ({ name: "myMessage", ...MsgSource }),
    ...LoadSettings.Msg,
};

const cmd = createCmd<Message>();

// Include the LoadSettings Model
export interface Model extends LoadSettings.Model {
    // ...
}

export const init = (): [Model, Cmd<Message>] => {
    // Return the model and dispatch the LoadSettings message
    return [
        {
            // Spread the initial model from LoadSettings
            ...LoadSettings.init(),
            // ...
        },
        cmd.ofMsg(Msg.loadSettings())
    ];
};

// In our update function, we first distinguish between the sources of the messages
export function update (model: Model, msg: Message): UpdateReturnType<Model, Message> {
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
        case "myMessage":
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
        | { name: "close" }
        ...

    export const Msg = {
        ...
        close: (): Message => ({ name: "close" }),
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
    case "close":
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
| `execCmd` | Executes the provided command and returns an array of all messages. |
| `getUpdateFn` | returns an `update` function for your update map object. |

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

### Testing all (async) messages

With `execCmd` you can execute all commands in a test scenario. All functions are called and awaited. The function returns all new messages (success or error messages).

It also resolves for `attempt` functions if the called functions succeed. And it rejects for `perform` functions if the called functions fail.

```ts
import * as Testing from "react-elmish/dist/Testing";

...
it("returns the correct cmd", () => {
    // arrange
    const model = { /* create model */ };
    const props = { /* create props */ };
    const msg = Shared.Msg.asyncTest();

    // mock function which is called when the "AsyncTest" message is handled
    const functionMock = jest.fn();

    // act
    const [, cmd] = Shared.update(model, msg, props);
    const messages = await Testing.execCmd(cmd);

    // assert
    expect(functionMock).toBeCalled();
    expect(messages).toEqual([Shared.Msg.asyncTestSuccess()])
});
...
```

### Testing with an UpdateMap

To test your update map, you can get an `update` function by calling `getUpdateFn`:

```ts
import { getUpdateFn } from "react-elmish/dist/Testing";

const update = getUpdateFn(updateMap);

// in your test call update as usual
const [model, cmd] = update(msg, model, props);
```

## Migration from v1.x to v2.x

* Use `Logger` and `Message` instead of `ILogger` and `IMessage`.
* The global declaration of the `Nullable` type was removed, because it is unexpected for this library to declare such a type. You can declare this type for yourself if needed:

    ```ts
    declare global {
        type Nullable<T> = T | null;
    }
    ```

## Migration from v2.x to v3.x

The signature of `useElmish` has changed. It takes an options object now. Thus there is no need for the `useElmishMap` function. Use the new `useElmish` hook with an `UpdateMap` instead.

To use the old `useElmish` and `useElmishMap` functions, import them from the legacy namespace:

```ts
import { useElmish } from "react-elmish/dist/legacy/useElmish";
import { useElmishMap } from "react-elmish/dist/legacy/useElmishMap";
```

**Notice**: These functions are marked as deprecated and will be removed in a later release.
