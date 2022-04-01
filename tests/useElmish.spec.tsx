import { Cmd, createCmd, UpdateReturnType, useElmish } from "../src";
import { render, RenderResult, waitFor } from "@testing-library/react";
import { useEffect } from "react";

type Message =
    | { name: "Test" }
    | { name: "First" }
    | { name: "Second" }
    | { name: "Third" };

interface Model {
    value1: string,
    value2: string,
}

interface Props {
    init: () => [Model, Cmd<Message>],
    update: (model: Model, msg: Message, props: Props) => UpdateReturnType<Model, Message>,
}

function defaultInit (msg: Cmd<Message>): [Model, Cmd<Message>] {
    return [
        {
            value1: "",
            value2: "",
        },
        msg,
    ];
}

function defaultUpdate (_model: Model, msg: Message): UpdateReturnType<Model, Message> {
    switch (msg.name) {
        case "Test":
            return [{}];

        case "First":
            return [{ value1: "First" }, cmd.ofMsg({ name: "Second" })];

        case "Second":
            return [{ value2: "Second" }];

        case "Third":
            return [{ value2: "Third" }];
    }
}

let componentModel: Model | undefined;
const cmd = createCmd<Message>();

describe("Hooks", () => {
    it("calls the init function", () => {
        // arrange
        const init = jest.fn().mockReturnValue([{}, []]);
        const update = jest.fn();
        const props: Props = {
            init,
            update,
        };

        // act
        renderComponent(props);

        // assert
        expect(init).toHaveBeenCalledWith(props);
    });

    it("calls the initial command", () => {
        // arrange
        const message: Message = { name: "Test" };
        const init = jest.fn().mockReturnValue([{}, cmd.ofMsg(message)]);
        const update = jest.fn((): UpdateReturnType<Model, Message> => [{}]);
        const props: Props = {
            init,
            update,
        };

        // act
        renderComponent(props);

        // assert
        expect(update).toHaveBeenCalledWith({}, message, props);
    });

    it("updates the model correctly with multiple commands in a row", () => {
        // arrange
        const message: Message = { name: "First" };
        const props: Props = {
            init: () => defaultInit(cmd.ofMsg(message)),
            update: defaultUpdate,
        };

        // act
        renderComponent(props);

        // assert
        expect(componentModel).toStrictEqual({ value1: "First", value2: "Second" });
    });

    it("updates the model correctly with multiple commands delayed", async () => {
        // arrange
        const props: Props = {
            init: () => defaultInit(cmd.none),
            update (_model: Model, msg: Message): UpdateReturnType<Model, Message> {
                // eslint-disable-next-line jest/no-conditional-in-test
                switch (msg.name) {
                    case "Test":
                        return [{}];

                    case "First":
                        return [{ value1: "First" }];

                    case "Second":
                        return [{ value1: "Second" }];

                    case "Third":
                        return [{ value2: "Third" }];
                }
            },
        };

        // act
        renderComponentWithEffect(props);

        await waitFor(async () => new Promise(resolve => {
            setTimeout(() => resolve(null), 30);
        }));

        // assert
        expect(componentModel).toStrictEqual({ value1: "Second", value2: "Third" });
    });
});

function TestComponent (props: Props): JSX.Element {
    const { init, update } = props;
    const [model] = useElmish({ props, init, update, name: "Test" });

    componentModel = model;

    return (
        <div />
    );
}

function renderComponent (props: Props): RenderResult {
    return render(<TestComponent {...props} />);
}

function TestComponentWithEffect (props: Props): JSX.Element {
    const { init, update } = props;
    const [model, dispatch] = useElmish({ props, init, update, name: "Test" });

    if (model.value1 === "") {
        setTimeout(() => dispatch({ name: "First" }), 5);
    }

    if (model.value1 === "First" && model.value2 === "") {
        setTimeout(() => dispatch({ name: "Second" }), 10);
    }

    componentModel = model;

    useEffect(() => {
        setTimeout(() => {
            dispatch({ name: "Third" });
        }, 20);
    }, []);

    return (
        <div />
    );
}

function renderComponentWithEffect (props: Props): RenderResult {
    return render(<TestComponentWithEffect {...props} />);
}