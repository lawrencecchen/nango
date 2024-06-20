/**
 * Transform any Error or primitive to a json object
 */
export declare function errorToObject(err: unknown): import("serialize-error").ErrorObject;
/**
 * Transform any Error or primitive to a string
 */
export declare function stringifyError(err: unknown, opts?: {
    pretty?: boolean;
    stack?: boolean;
}): string;
