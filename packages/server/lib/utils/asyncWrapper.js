import { isAsyncFunction } from 'util/types';
export function asyncWrapper(fn) {
    if (isAsyncFunction(fn)) {
        return (req, res, next) => {
            return fn(req, res, next).catch((err) => {
                next(err);
            });
        };
    }
    else {
        return fn;
    }
}
//# sourceMappingURL=asyncWrapper.js.map