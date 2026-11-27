import { createVariantCallBase } from "./createCallBase";
import type { Message } from "./Types";
import type * as Variant from "./UpdateTypes";

/**
 * Creates the options for an update handler.
 * @param msg The current message.
 * @param model The model (or draft) the update is working on.
 * @param props The current props.
 * @param defer The `defer` function of the update.
 * @param optionsTemplate Overrides for the options (used in tests). Options which are `undefined` are not overridden.
 * @returns The options for the update handler.
 */
function createUpdateOptions<TVariant extends Variant.Variant, TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: Variant.HandlerModel<TVariant, TModel>,
	props: TProps,
	defer: Variant.DeferFunction<TVariant, TModel, TMessage>,
	optionsTemplate: Partial<Variant.UpdateFunctionOptions<TVariant, TProps, TModel, TMessage>> | undefined,
): Variant.UpdateFunctionOptions<TVariant, TProps, TModel, TMessage> {
	// The options template may replace `defer` (in tests), so the base handlers must get it, too.
	const options = { ...optionsTemplate, defer: optionsTemplate?.defer ?? defer };

	return { ...options, callBase: optionsTemplate?.callBase ?? createVariantCallBase(msg, model, props, options) };
}

/**
 * Calls the update function or the handler of the UpdateMap for the message.
 */
function callUpdate<TVariant extends Variant.Variant, TProps, TModel, TMessage extends Message>(
	update: Variant.Update<TVariant, TProps, TModel, TMessage>,
	msg: TMessage,
	model: Variant.HandlerModel<TVariant, TModel>,
	props: TProps,
	options: Variant.UpdateFunctionOptions<TVariant, TProps, TModel, TMessage>,
): Variant.UpdateReturnType<TVariant, TModel, TMessage> {
	if (typeof update === "function") {
		return update(model, msg, props, options);
	}

	const msgName: TMessage["name"] = msg.name;

	return update[msgName](msg, model, props, options);
}

export { callUpdate, createUpdateOptions };
