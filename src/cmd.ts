import { Cmd, Dispatch, FallbackHandler, Message, Sub } from "./Types";

const cmd = {
    ofMsg<TMessage extends Message> (msg: TMessage): Cmd<TMessage> {
        return [dispatch => dispatch(msg)];
    },
    batch<TMessage extends Message> (...commands: (Cmd<TMessage> | undefined | null) []): Cmd<TMessage> {
        return (commands.filter(Boolean) as Cmd<TMessage> []).flat();
    },
    ofSub<TMessage extends Message> (sub: Sub<TMessage>): Cmd<TMessage> {
        return [sub];
    },
    ofFunc: {
        either<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMessage, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>): void => {
                try {
                    const result = task(...args);

                    dispatch(ofSuccess(result));
                } catch (ex: unknown) {
                    dispatch(ofError(ex as Error));
                }
            };

            return [bind];
        },
        perform<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>, fallback?: FallbackHandler): void => {
                try {
                    const result = task(...args);

                    dispatch(ofSuccess(result));
                } catch (ex: unknown) {
                    if (fallback) {
                        fallback(ex as Error);
                    }
                }
            };

            return [bind];
        },
        attempt<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>, fallback?: FallbackHandler): void => {
                try {
                    task(...args);

                    if (fallback) {
                        fallback();
                    }
                } catch (ex: unknown) {
                    dispatch(ofError(ex as Error));
                }
            };

            return [bind];
        },
    },
    ofPromise: {
        either<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMessage, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>): void => {
                task(...args).then(result => dispatch(ofSuccess(result)))
                    .catch((ex: Error) => dispatch(ofError(ex)));
            };

            return [bind];
        },
        perform<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const defaultFallbackHandler = (): void => {
                // blank
            };

            const bind = (dispatch: Dispatch<TMessage>, fallback: FallbackHandler = defaultFallbackHandler): void => {
                task(...args).then(result => dispatch(ofSuccess(result)))
                    .catch(fallback);
            };

            return [bind];
        },
        attempt<TMessage extends Message, TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofError: (error: Error) => TMessage, ...args: TArgs): Cmd<TMessage> {
            const bind = (dispatch: Dispatch<TMessage>, fallback?: FallbackHandler): void => {
                task(...args).then(() => {
                    if (fallback) {
                        fallback();
                    }
                })
                    .catch((ex: Error) => dispatch(ofError(ex)));
            };

            return [bind];
        },
    },
};

export {
    cmd,
};