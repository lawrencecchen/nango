export function Ok(value) {
    return {
        value,
        unwrap: () => value,
        isErr: () => false,
        isOk: () => true,
        map: (fn) => {
            try {
                return Ok(fn(value));
            }
            catch (error) {
                return Err(error);
            }
        },
        mapError: (_fn) => {
            return Ok(value);
        }
    };
}
export function Err(error) {
    return {
        error: typeof error === 'string' ? new Error(error) : error,
        unwrap: () => {
            throw error;
        },
        isErr: () => true,
        isOk: () => false,
        map: (_fn) => {
            return Err(error);
        },
        mapError: (fn) => {
            try {
                return Err(fn(typeof error === 'string' ? new Error(error) : error));
            }
            catch (error) {
                return Err(error);
            }
        }
    };
}
//# sourceMappingURL=result.js.map