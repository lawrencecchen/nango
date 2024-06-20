import { serializeError } from 'serialize-error';
/**
 * Transform any Error or primitive to a json object
 */
export function errorToObject(err) {
    return serializeError(err);
}
/**
 * Transform any Error or primitive to a string
 */
export function stringifyError(err, opts) {
    return JSON.stringify(serializeError(err), ['name', 'message', ...(opts?.stack ? ['stack', 'cause'] : [])], opts?.pretty ? 2 : undefined);
}
//# sourceMappingURL=errors.js.map