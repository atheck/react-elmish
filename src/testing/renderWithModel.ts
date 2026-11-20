import { type RenderWithModelOptions, setFakeOptions } from "../fakeOptions";
import type { Message } from "../Types";
import { isPromiseLike } from "./isPromiseLike";

/**
 * Renders a component with a provided model.
 * The model is used by the first component initialized while `render` runs (by its name), not by its child components.
 * @template TMessage The type of the message discriminated union.
 * @template TResult The return type of the render function.
 * @param {() => TResult} render A function to render the component. Use the `render` function of the used testing library.
 * @param {object} model The model to use instead of calling `init`. Type it explicitly (e.g. `const model: Model = ...`) to have it checked.
 * @param {RenderWithModelOptions<TMessage>} [options] Additional options, e.g. a fake dispatch function.
 * @returns {TResult} The returned value of the `render` function. If it is a promise, the model is used until it settles.
 */
function renderWithModel<TMessage extends Message, TResult>(
	render: () => TResult,
	model: object,
	options?: RenderWithModelOptions<TMessage>,
): TResult {
	setFakeOptions({
		model,
		...options,
	});

	let result: TResult;

	try {
		result = render();
	} catch (ex) {
		setFakeOptions(null);

		throw ex;
	}

	if (isPromiseLike(result)) {
		const reset = (): void => setFakeOptions(null);

		// The caller awaits the original result, we only reset the options.
		Promise.resolve(result).then(reset).catch(reset);
	} else {
		setFakeOptions(null);
	}

	return result;
}

export { renderWithModel };
