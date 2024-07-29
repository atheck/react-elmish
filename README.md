# react-elmish

![Build](https://github.com/atheck/react-elmish/actions/workflows/release.yml/badge.svg)
![npm](https://img.shields.io/npm/v/react-elmish)

This library brings the elmish pattern to react.

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [More about messages](#more-about-messages)
  - [Message parameters](#message-parameters)
- [Dispatch commands in the update map or update function](#dispatch-commands-in-the-update-map-or-update-function)
  - [Dispatch a message](#dispatch-a-message)
  - [Call an async function](#call-an-async-function)
  - [Dispatch a command from `init`](#dispatch-a-command-from-init)
  - [Dispatching multiple commands](#dispatching-multiple-commands)
- [Subscriptions](#subscriptions)
  - [Working with external sources of events](#working-with-external-sources-of-events)
  - [Cleanup subscriptions](#cleanup-subscriptions)
- [Setup](#setup)
- [Error handling](#error-handling)
- [React life cycle management](#react-life-cycle-management)
- [Deferring model updates and messages](#deferring-model-updates-and-messages)
- [Call back parent components](#call-back-parent-components)
- [Composition](#composition)
  - [With an `UpdateMap`](#with-an-updatemap)
- [With an update function](#with-an-update-function)
- [Testing](#testing)
  - [Testing the init function](#testing-the-init-function)
  - [Testing the update handler](#testing-the-update-handler)
  - [Combine update and execCmd](#combine-update-and-execcmd)
  - [Testing subscriptions](#testing-subscriptions)
  - [UI Tests](#ui-tests)
- [Migrations](#migrations)
  - [From v1.x to v2.x](#from-v1x-to-v2x)
  - [From v2.x to v3.x](#from-v2x-to-v3x)
  - [From v3.x to v4.x](#from-v3x-to-v4x)
  - [From v6.x to v7.x](#from-v6x-to-v7x)
- [VS Code Snippets Extension](#vs-code-snippets-extension)

## Installation

`npm install react-elmish`

## Basic Usage

An elmish component basically consists of the following parts:

- The **Model** holding the state of the component.
- The **Props** for the component.
- The **Init** function to create the initial model based on the props.
- The **Messages** to dispatch which modify the model.
- The **Update** function to modify the model based on a specific message.
- The **View** which renders the component based on the current model.

**App.ts:**

First import everything from `react-elmish` and declare the **Message** discriminated union type:

```ts
import { Cmd, InitResult, UpdateReturnType, UpdateMap } from "react-elmish";

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
export function init (props: Props): InitResult<Model, Message> {
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

**Note:** When using an `UpdateMap` it is recommended to use camelCase for message names (e.g. "increment" instead of "Increment").

Alternatively we can use an `update` function:

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

**App.tsx:**

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

You can also write the component as a **class component**:

```tsx
// Import everything from the App.ts
import { Model, Message, Props, init, update, Msg } as Shared from "../App";
// Import the ElmComponent which extends React.Component
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

> **Note**: When using a class component, you can only use an `update` function. Class components do not support `UpdateMap`s.

You can use these components like any other React component.

> **Note**: It is recommended to separate business logic and the view into separate modules. Here we put the `Messages`, `Model`, `Props`, `init`, and `update` functions into **App.ts**. The elmish React Component resides in a **Components** subfolder and is named **App.tsx**.
>
> You can even split the contents of the **App.ts** into two files: **Types.ts** (`Message`, `Model`, and `Props`) and **State.ts** (`init` and `update`).

## More about messages

### Message parameters

Messages can also have parameters. You can modify the example above and pass an optional step value to the **Increment** message:

```ts
export type Message =
    | { name: "increment", step?: number }
    ...

export const Msg = {
    increment: (step?: number): Message => ({ name: "increment", step }),
    ...
}
```

Then use this parameter in the update handler:

```ts
{
    // ...
    // We destructure the message parameter here
    increment ({ step }) {
        return [{ value: model.value + (step ?? 1)}]
    }
    // ...
};
```

In the **render** method you can add another button to increment the value by 10:

```tsx
...
<button onClick={() => this.dispatch(Shared.Msg.increment(10))}>Increment by 10</button>
...
```

## Dispatch commands in the update map or update function

In addition to modifying the model, you can dispatch new commands here.

To do so, you can use the `cmd` object:

```ts
import { cmd } from "react-elmish";
```

You can call one of the functions of that object:

| Function | Description |
|---|---|
| `cmd.ofMsg` | Dispatches a new message. |
| `cmd.batch` | Aggregates an array of messages. |
| `cmd.ofEither` | Calls a function (sync or async) and maps the result into a message. |
| `cmd.ofSuccess` | Same as `ofEither` but ignores the error case. |
| `cmd.ofError` | Same as `ofEither` but ignores the success case. |
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
```

In the **update map** or **update** function you can dispatch that message like this:

```ts
{
    increment () {
        return [{ value: model.value + 1 }, cmd.ofMsg(Msg.printLastMessage("Incremented by one"))];
    }
}
```

This new message will immediately be dispatched after returning from the **update** handler.

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
{
    // ...
    loadSettings () {
        // Create a command out of the async function with the provided arguments
        // If loadSettings resolves it dispatches "SettingsLoaded"
        // If it fails it dispatches "Error"
        // The return type of loadSettings must fit Msg.settingsLoaded
        return [{}, cmd.ofEither(loadSettings, Msg.settingsLoaded, Msg.error, "firstArg", 123)];
    },

    settingsLoaded () {
        return [{ settings: msg.settings }];
    },

    error () {
        return handleError(msg.error);
    },
    // ...
};
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

### Dispatching multiple commands

To dispatch more than one command from `init` or `update` you can either use the `cmd.batch` function or simply return multiple commands:

```ts
return [{}, cmd.ofMsg(Msg.loadData()), cmd.ofEither(doStuff, Msg.success, Msg.error)];
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
        clearInterval(timer);
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
    import { ErrorMessage, errorHandler, errorMsg, handleError } from "react-elmish";

    export type Message =
        // | ...
        | ErrorMessage;
    ```

1. Optionally add the convenient function to the `Msg` object:

    ```ts
    export const Msg = {
        // ...
        ...errorMsg,
    }
    ```

1. Handle the error message
    1. In the `update` function:

        ```ts
        // ...
        case "error":
            return handleError(msg.error);
        // ...
        ```

    1. Or in the `UpdateMap`:

        ```ts
        const updateMap = {
            // ...
            error ({ error }) {
                return handleError(error);
            }
        };
        ```

        You can also use the `errorHandler` helper function:

        ```ts
        const updateMap = {
            // ...
            ...errorHandler()
        };
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

## Deferring model updates and messages

Sometimes you want to always dispatch a message or update the model in all cases. You can use the `defer` function from the `options` parameter to do this. The `options` parameter is the fourth parameter of the `update` function.

Without the `defer` function, you would have to return the model and the command in all cases:

```ts
const update: UpdateMap<Props, Model, Message> = {
    deferSomething (_msg, model) {
        if (model.someCondition) {
            return [{ alwaysUpdate: "someValue", extra: "extra" }, cmd.ofMsg(Msg.alwaysExecute())];
        }

        return [{ alwaysUpdate: "someValue" }, cmd.ofMsg(Msg.doSomethingElse()), cmd.ofMsg(Msg.alwaysExecute())];
    },

    ...LoadSettings.update,
};
```

Here we always want to update the model with the `alwaysUpdate` property and always dispatch the `alwaysExecute` message.

With the `defer` function, you can do this:

```ts
const update: UpdateMap<Props, Model, Message> = {
    deferSomething (_msg, model, _props, { defer }) {
        defer({ alwaysUpdate: "someValue" }, cmd.ofMsg(Msg.alwaysExecute()));

        if (model.someCondition) {
            return [{ extra: "extra" }];
        }

        return [{}, cmd.ofMsg(Msg.doSomethingElse())];
    },

    ...LoadSettings.update,
};
```

The `defer` function can be called multiple times. Model updates and commands are then aggregated. Model updates by the return value overwrite the deferred model updates, while deferred messages are dispatched after the returned messages.

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
    {
        // ...
        close () {
            return [{}, cmd.ofError(props.onClose, Msg.error)];
        }
        // ...
    };
    ```

1. In the **render** method of the parent component pass the callback as prop

    ```tsx Parent.tsx
    ...
    <Dialog onClose={() => this.dispatch(Msg.closeDialog())}>
    ...
    ```

## Composition

If you have some business logic that you want to reuse in other components, you can do this by using different sources for messages.

### With an `UpdateMap`

Let's say you want to load some settings, you can write a module like this:

```ts LoadSettings.ts
import { cmd, ErrorMessage, UpdateMap, handleError } from "react-elmish";

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
        return [{}, cmd.ofEither(loadSettings, Msg.settingsLoaded, Msg.error)];
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
import { cmd, InitResult, UpdateMap } from "react-elmish";

// Here we define our local messages
type Message =
    | { name: "myMessage" }
    | LoadSettings.Message;

// And spread the Msg of LoadSettings object
export const Msg = {
    myMessage: (): Message => ({ name: "myMessage" }),
    ...LoadSettings.Msg,
};

interface Props {}

// Extend the LoadSettings model
interface Model extends LoadSettings.Model {
    // ...
}

function init (): InitResult<Model, Message> {
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

    // You can overwrite the LoadSettings messages handlers here

    settingsLoaded (_msg, _model, _props, { defer, callBase }) {
        // Use defer and callBase to execute the original handler function:
        defer(...callBase(LoadSettings.settingsLoaded));

        // Do additional stuff
        return [{ /* ... */ }];
    }
};
```

## With an update function

Let's say you want to load some settings, you can write a module like this:

```ts LoadSettings.ts
import { cmd, InitResult, MsgSource, ErrorMessage, UpdateReturnType, handleError } from "react-elmish";

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

export interface Model {
    settings: Settings | null,
}

export function init (): InitResult<Model, Message> {
    return [{ settings: null }];
}

export function update (_model: Model, msg: Message): UpdateReturnType<Model, Message> {
    switch (msg.name) {
        case "loadSettings":
            return [{}, cmd.ofEither(loadSettings, Msg.settingsLoaded, Msg.error)];

        case "settingsLoaded":
            return [{ settings: msg.settings }];

        case "error":
            return handleError(msg.error);
    }
}

async function loadSettings (): Promise<Settings> {
    // Call some service (e.g. database or backend)
    return {};
}
```

> **Note**: This module has no **View**.

In other components where we want to use this **LoadSettings** module, we also need a message source:

```ts Composition.ts
import { cmd, InitResult, MsgSource, UpdateReturnType } from "react-elmish";
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

// Include the LoadSettings Model
export interface Model extends LoadSettings.Model {
    // ...
}

export function init (): InitResult<Model, Message> {
    // Return the model and dispatch the LoadSettings message
    return [
        {
            // Spread the initial model from LoadSettings
            ...LoadSettings.init(),
            // ...
        },
        cmd.ofMsg(Msg.loadSettings())
    ];
}

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

## Testing

To test your **update** handler you can use some helper functions in `react-elmish/dist/Testing`:

| Function | Description |
| --- | --- |
| `initAndExecCmd` | Calls the `init` function with the provided props and executes the returned commands. |
| `getUpdateFn` | Returns an `update` function for your update map object. |
| `getUpdateAndExecCmdFn` | Returns an `update` function for your update map object, which immediately executes the command. |
| `getCreateUpdateArgs` | Creates a factory function to create a message, a model, and props in a test. |
| `createUpdateArgsFactory` | This is an alternative for `getCreateUpdateArgs`. Creates a factory function to create a message, a model, and props in a test. |
| `execCmd` | Executes the provided command and returns an array of all messages. |

### Testing the init function

```ts
import { initAndExecCmd } from "react-elmish/dist/Testing";
import { init, Msg } from "./MyComponent";

it("initializes the model correctly", async () => {
    // arrange
    const props = { /* Create initial props */ };

    // act
    const [model, messages] = await initAndExecCmd(init, props);

    // assert
    expect(model).toStrictEqual({ /* what you expect in the model */ });
    expect(messages).toEqual([Msg.loadData()]);
});
```

### Testing the update handler

**Note**: When using an `UpdateMap`, you can get an `update` function by calling `getUpdateFn`:

```ts
import { getUpdateFn } from "react-elmish/dist/Testing";
import { updateMap } from "./MyComponent";

const updateFn = getUpdateFn(updateMap);

// Call the update function in the test
const [model, cmd] = updateFn(msg, model, props);
```

A simple test:

```ts
import { getCreateUpdateArgs, createUpdateArgsFactory, execCmd } from "react-elmish/dist/Testing";
import { init, Msg } from "./MyComponent";

const createUpdateArgs = getCreateUpdateArgs(init, () => ({ /* initial props */ }));
// Or: const createUpdateArgs = createUpdateArgsFactory(() => ({ /* initial model */ }), () => ({ /* initial props */ }));

it("returns the correct model and cmd", async () => {
    // arrange
    const args = createUpdateArgs(Msg.test(), { /* optionally override model here */ }, { /* optionally override props here */ }, { /* optionally override options here */ });

    // act
    // Call the update handler
    const [newModel, cmd] = updateFn(...args);
    const messages = await execCmd(cmd);

    // assert
    expect(newModel).toStrictEqual({ /* what you expect in the model */ });
    expect(messages).toEqual([
        Msg.expectedMsg1("arg"),
        Msg.expectedMsg2(),
    ]);
});
```

With `execCmd` you can execute all commands in a test scenario. All functions are called and awaited. The function returns all new messages (success or error messages).

It also resolves for `attempt` functions if the called functions succeed. And it rejects for `perform` functions if the called functions fail.

### Combine update and execCmd

There is an alternative function `getUpdateAndExecCmdFn` to get the `update` function for an update map, which immediately invokes the command and returns the messages.

```ts
import { createUpdateArgs, getUpdateAndExecCmdFn } from "react-elmish/dist/Testing";

const updateAndExecCmdFn = getUpdateAndExecCmdFn(updateMap);

...
it("returns the correct cmd", async () => {
    // arrange
    const args = createUpdateArgs(Msg.asyncTest());

    // mock function which is called when the "AsyncTest" message is handled
    const functionMock = jest.fn();

    // act
    const [, messages] = await updateAndExecCmdFn(...args);

    // assert
    expect(functionMock).toBeCalled();
    expect(messages).toEqual([Msg.asyncTestSuccess()])
});
...
```

### Testing subscriptions

It is almost the same as testing the `update` function. You can use the `getCreateModelAndProps` function to create a factory for the model and the props. Then use `execSubscription` to execute the subscriptions:

```ts
import { getCreateModelAndProps, execSubscription } from "react-elmish/dist/Testing";
import { init, Msg, subscription } from "./MyComponent";

const createModelAndProps = getCreateModelAndProps(init, () => ({ /* initial props */ }));

it("dispatches the eventTriggered message", async () => {
    // arrange
    const mockDispatch = jest.fn();
    const args = createModelAndProps({ /* optionally override model here */ }, { /* optionally override props here */ });
    const dispose = execSubscription(subscription, mockDispatch, ...args);

    // act
    // Trigger events

    // assert
    expect(mockDispatch).toHaveBeenCalledWith(Msg.eventTriggered());

    // Dispose the subscriptions if required
    dispose();
});
```

### UI Tests

To test UI components with a fake model you can use `renderWithModel` from the Testing namespace. The first parameter is a function to render your component (e.g. with **@testing-library/react**). The second parameter is the fake model. The third parameter is an optional options object, where you can also pass a fake `dispatch` function.

```tsx
import { renderWithModel } from "react-elmish/dist/Testing";
import { fireEvent, render, screen } from "@testing-library/react";

it("renders the correct value", () => {
    // arrange
    const model: Model = { value: "It works" };

    // act
    renderWithModel(() => render(<TestComponent />), model);

    // assert
    expect(screen.getByText("It works")).not.toBeNull();
});

it("dispatches the correct message", async () => {
    // arrange
    const model: Model = { value: "" };
    const mockDispatch = jest.fn();

    renderWithModel(() => render(<TestComponent />), model, { dispatch: mockDispatch });

    // act
    fireEvent.click(screen.getByText("Click"));

    // assert
    expect(mockDispatch).toHaveBeenCalledWith({ name: "click" });
});
```

This works for function components using the `useElmish` hook and class components.

## Migrations

### From v1.x to v2.x

- Use `Logger` and `Message` instead of `ILogger` and `IMessage`.
- The global declaration of the `Nullable` type was removed, because it is unexpected for this library to declare such a type. You can declare this type for yourself if needed:

    ```ts
    declare global {
        type Nullable<T> = T | null;
    }
    ```

### From v2.x to v3.x

The signature of `useElmish` has changed. It takes an options object now. Thus there is no need for the `useElmishMap` function. Use the new `useElmish` hook with an `UpdateMap` instead.

To use the old `useElmish` and `useElmishMap` functions, import them from the legacy namespace:

```ts
import { useElmish } from "react-elmish/dist/legacy/useElmish";
import { useElmishMap } from "react-elmish/dist/legacy/useElmishMap";
```

**Notice**: These functions are marked as deprecated and will be removed in a later release.

### From v3.x to v4.x

Because the legacy `useElmish` and `useElmishMap` have been removed, you have to convert all usages of `useElmish` to use the parameter object.

### From v6.x to v7.x

The function `createCmd` has been removed. Instead, import the `cmd` object.

The test function `getOfMsgParams` has been removed. Use `execCmd` instead, or use the `getUpdateAndExecCmdFn` function and use the returned `update` function. To test the `init` function, use `initAndExecCmd`.

## VS Code Snippets Extension

You can install a snippet extension to create common elmish boilerplate code:

[React Elmish Snippets (atheck.react-elmish-snippets)](https://marketplace.visualstudio.com/items?itemName=atheck.react-elmish-snippets)
