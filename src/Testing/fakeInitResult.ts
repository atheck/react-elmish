import { InitResult, MessageBase, Nullable } from "../Types";
import { Dispatch } from "../Cmd";

type FakeInitResult = Nullable<[unknown, unknown?]>;

let currentFakeInitResult: FakeInitResult;
let currentFakeDispatch: Nullable<Dispatch<MessageBase>>;

function setFakes (fakeInitResult: FakeInitResult, fakeDispatch?: Nullable<Dispatch<MessageBase>>): void {
    currentFakeInitResult = fakeInitResult;
    currentFakeDispatch = fakeDispatch ?? null;
}

function getFakeInitResultOnce<TModel, TMessage extends MessageBase> (): Nullable<InitResult<TModel, TMessage>> {
    const temp = currentFakeInitResult as Nullable<InitResult<TModel, TMessage>>;

    currentFakeInitResult = null;

    return temp;
}

function getFakeDispatchOnce<TMessage extends MessageBase> (): Nullable<Dispatch<TMessage>> {
    const temp = currentFakeDispatch;

    currentFakeDispatch = null;

    return temp;
}

export {
    setFakes,
    getFakeInitResultOnce,
    getFakeDispatchOnce,
};