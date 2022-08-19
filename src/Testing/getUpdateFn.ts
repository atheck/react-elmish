import { MessageBase, UpdateMap, UpdateReturnType } from "../Types";
import { callUpdateMap } from "../useElmish";

/**
 * Creates an update function out of an UpdateMap.
 * @param {UpdateMap<TProps, TModel, TMessage>} updateMap The UpdateMap.
 * @returns {(msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage>} The created update function which can be used in tests.
 */
function getUpdateFn<TProps, TModel, TMessage extends MessageBase> (updateMap: UpdateMap<TProps, TModel, TMessage>): (msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage> {
    return function (msg: TMessage, model: TModel, props: TProps): UpdateReturnType<TModel, TMessage> {
        return callUpdateMap(updateMap, msg, model, props);
    };
}

export {
    getUpdateFn,
};