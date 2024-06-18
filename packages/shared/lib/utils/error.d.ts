export declare class NangoError extends Error {
    readonly status: number;
    readonly type: string;
    payload: Record<string, unknown>;
    readonly message: string;
    constructor(type: string, payload?: {}, status?: number);
    setPayload(payload: any): void;
}
export declare const formatScriptError: (
    err: any,
    errorType: string,
    scriptName: string
) => {
    success: boolean;
    error: NangoError;
    response: any;
};
