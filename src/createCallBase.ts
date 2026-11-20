import type { CallBaseFunction, Message, UpdateFunctionOptions } from "./Types";
import type * as Variant from "./UpdateTypes";

/**
 * Creates the `callBase` function for an update handler of either variant.
 * @param msg The current message.
 * @param model The model (or draft) the current update is working on.
 * @param props The current props.
 * @param options The options passed to the update handler, without `callBase`.
 * @returns The `callBase` function.
 */
function createVariantCallBase<TVariant extends Variant.Variant, TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: Variant.HandlerModel<TVariant, TModel>,
	props: TProps,
	options: Omit<Variant.UpdateFunctionOptions<TVariant, TProps, TModel, TMessage>, "callBase">,
): Variant.CallBaseFunction<TVariant, TModel, TProps, TMessage> {
	const callBase = <TBaseMessage extends Message>(
		fn: Variant.BaseHandler<TVariant, TModel, TProps, TMessage, TBaseMessage>,
	): Variant.UpdateReturnType<TVariant, TModel, TBaseMessage> => {
		// biome-ignore lint/nursery/noUnsafeTypeAssertion: The base handler defers its own messages, which must be part of the messages of the calling component.
		const defer = options.defer as unknown as Variant.DeferFunction<TVariant, TModel, TBaseMessage>;

		return fn(msg, model, props, { ...options, defer, callBase });
	};

	return callBase;
}

/**
 * Creates the `callBase` function for an update handler.
 * @param msg The current message.
 * @param model The model the current update is working on.
 * @param props The current props.
 * @param options The options passed to the update handler, without `callBase`.
 * @returns The `callBase` function, which returns the model changes and the commands of the base handler.
 */
function createCallBase<TProps, TModel, TMessage extends Message>(
	msg: TMessage,
	model: TModel,
	props: TProps,
	options: Omit<UpdateFunctionOptions<TProps, TModel, TMessage>, "callBase">,
): CallBaseFunction<TModel, TProps, TMessage> {
	return createVariantCallBase<"mutable", TProps, TModel, TMessage>(msg, model, props, options);
}

export { createCallBase, createVariantCallBase };
