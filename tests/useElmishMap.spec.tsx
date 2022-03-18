import { Cmd, createCmd, UpdateMap, useElmishMap } from "../src";
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
    updateMap: UpdateMap<Props, Model, Message>,
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

const defaultUpdateMap: UpdateMap<Props, Model, Message> = {
    Test: () => [{}],
    First: () => [{ value1: "First" }, cmd.ofMsg({ name: "Second" })],
    Second: () => [{ value2: "Second" }],
    Third: () => [{ value2: "Third" }],
};

let componentModel: Model | undefined;
const cmd = createCmd<Message>();

describe("Hooks", () => {
    it("calls the init function", () => {
        // arrange
        const init = jest.fn().mockReturnValue([{}, []]);
        const props: Props = {
            init,
            updateMap: defaultUpdateMap,
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
        const props: Props = {
            init,
            updateMap: defaultUpdateMap,
        };

        const mockTest = jest.spyOn(defaultUpdateMap, "Test");

        // act
        renderComponent(props);

        // assert
        expect(mockTest).toHaveBeenCalledWith(message, {}, props);

        mockTest.mockReset();
    });

    it("updates the model correctly with multiple commands in a row", () => {
        // arrange
        const message: Message = { name: "First" };
        const props: Props = {
            init: () => defaultInit(cmd.ofMsg(message)),
            updateMap: defaultUpdateMap,
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
            updateMap: {
                Test: () => [{}],
                First: () => [{ value1: "First" }],
                Second: () => [{ value1: "Second" }],
                Third: () => [{ value2: "Third" }],
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
    const { init, updateMap } = props;
    const [model] = useElmishMap(props, init, updateMap, "Test");

    componentModel = model;

    return (
        <div />
    );
}

function renderComponent (props: Props): RenderResult {
    return render(<TestComponent {...props} />);
}

function TestComponentWithEffect (props: Props): JSX.Element {
    const { init, updateMap } = props;
    const [model, dispatch] = useElmishMap(props, init, updateMap, "Test");

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