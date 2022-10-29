import { Message } from "../Types";
import { RenderWithModelOptions, setFakeOptions } from "./fakeOptions";

/**
 * Renders a component with a provided model.
 * @template TModel The type of the model.
 * @template TMessage The type of the message discriminated union.
 * @template TResult The return type of the render function.
 * @param {() => TResult} render A function to render the component. Use the `render` function of the used testing library.
 * @param {(TModel | RenderWithModelOptions<TModel, TMessage>)} options The model or an options object.
 * @returns {TResult} The returned value of the `render` function.
 */
function renderWithModel<TModel, TMessage extends Message, TResult> (render: () => TResult, options: TModel | RenderWithModelOptions<TModel, TMessage>): TResult {
    if ("model" in options && "dispatch" in options) {
        setFakeOptions(options as RenderWithModelOptions<unknown, Message>);
    } else {
        setFakeOptions({
            model: options,
        });
    }

    const result = render();

    setFakeOptions(null);

    return result;
}

export {
    renderWithModel,
};