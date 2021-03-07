export type Dispatch<TMsg> = (msg: TMsg) => void;

type Sub<TMsg> = (dispatch: Dispatch<TMsg>) => void;

export type Cmd<TMsg> = Sub<TMsg> [];

/**
 * Klasse zum Erstellen von typisierten Commands.
 * @class Command
 * @template TMsg Typ der Msg Union.
 */
class Command<TMsg> {
    /**
     * Stellt ein leeres Command dar.
     */
    none = [];

    /**
     * Erstellt ein Cmd aus einer bestimmten Msg.
     * @param {TMsg} msg Die auszulösende Msg.
     */
    ofMsg(msg: TMsg): Cmd<TMsg> {
        return [dispatch => dispatch(msg)];
    }

    /**
     * Aggregiert mehrere Commands.
     * @param {Cmd<TMsg> []} commands Die Auflistung der Commands.
     */
    batch(...commands: Cmd<TMsg> []): Cmd<TMsg> {
        const result: Cmd<TMsg> = [];

        return result.concat(...commands);
    }

    /**
     * Objekt zum Erstellen von Commands für Funktionsaufrufe.
     */
    ofFunc = {
        /**
        * Erstellt ein Command für einen Funktionsaufruf.
        * @param task Die aufzurufende Funktion.
        * @param ofSuccess Erstellt die Msg, die nach der erfolgreichen Ausführung der Funktion ausgelöst werden soll.
        * @param ofError Erstellt die Msg, die nach einem Fehler bei der Ausführung der Funktion ausgelöst werden soll.
        * @param args Die Parameter für die Funktion.
        */
        either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => TReturn, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
            const bind = (dispatch: Dispatch<TMsg>) => {
                try {
                    const result = task(...args);

                    dispatch(ofSuccess(result));
                } catch (error) {
                    dispatch(ofError(error));
                }
            };

            return [bind];
        },
    };

    /**
     * Objekt zum Erstellen von Commands für asynchrone Funktionsaufrufe.
     */
    ofPromise = {
        /**
        * Erstellt ein Command für einen asynchronen Funktionsaufruf.
        * @param task Die aufzurufende Funktion.
        * @param ofSuccess Erstellt die Msg, die nach der erfolgreichen Ausführung der Funktion ausgelöst werden soll.
        * @param ofError Erstellt die Msg, die nach einem Fehler bei der Ausführung der Funktion ausgelöst werden soll.
        * @param args Die Parameter für die Funktion.
        */
        either<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMsg, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
            const bind = (dispatch: Dispatch<TMsg>) => {
                task(...args).then(result => dispatch(ofSuccess(result))).catch(error => dispatch(ofError(error)));
            };

            return [bind];
        },

        /**
        * Erstellt ein Command für einen asynchronen Funktionsaufruf und ignoriert den Fehlerfall.
        * @param task Die aufzurufende Funktion.
        * @param ofSuccess Erstellt die Msg, die nach der erfolgreichen Ausführung der Funktion ausgelöst werden soll.
        * @param args Die Parameter für die Funktion.
        */
        perform<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofSuccess: (result: TReturn) => TMsg, ...args: TArgs): Cmd<TMsg> {
            const bind = (dispatch: Dispatch<TMsg>) => {
                task(...args).then(result => dispatch(ofSuccess(result))).catch(() => undefined);
            };

            return [bind];
        },

        /**
        * Erstellt ein Command für einen asynchronen Funktionsaufruf und ignoriert den Erfolgsfall.
        * @param task Die aufzurufende Funktion.
        * @param ofError Erstellt die Msg, die nach einem Fehler bei der Ausführung der Funktion ausgelöst werden soll.
        * @param args Die Parameter für die Funktion.
        */
        attempt<TArgs extends unknown [], TReturn>(task: (...args: TArgs) => Promise<TReturn>, ofError: (error: Error) => TMsg, ...args: TArgs): Cmd<TMsg> {
            const bind = (dispatch: Dispatch<TMsg>) => {
                task(...args).catch(error => dispatch(ofError(error)));
            };

            return [bind];
        },
    };
}

/**
 * Erstellt eine Instanz der Command Klasse.
 * @template TMsg Typ der Msg Union.
 * @see Command
 */
export const createCmd = <TMsg>(): Command<TMsg> => {
    return new Command<TMsg>();
};