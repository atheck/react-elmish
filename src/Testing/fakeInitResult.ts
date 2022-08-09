import { InitResult, MessageBase, Nullable } from "../Types";

type FakeInitResult = Nullable<[unknown, unknown?]>;

let initResult: FakeInitResult;

function setFakeInitResult (model: FakeInitResult): void {
    initResult = model;
}

function getFakeInitResultOnce<TModel, TMessage extends MessageBase> (): Nullable<InitResult<TModel, TMessage>> {
    const temp = initResult as Nullable<InitResult<TModel, TMessage>>;

    initResult = null;

    return temp;
}

export {
    setFakeInitResult,
    getFakeInitResultOnce,
};