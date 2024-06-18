"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function useSet(initialValue, limit) {
    const [, setInc] = (0, react_1.useState)(false);
    const set = (0, react_1.useMemo)(() => {
        return new Set(initialValue);
    }, [initialValue]);
    const add = (0, react_1.useCallback)((item) => {
        if (set.has(item) || (limit && Array.from(set.values()).length >= limit))
            return;
        setInc((prev) => !prev);
        set.add(item);
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setInc]);
    const remove = (0, react_1.useCallback)((item) => {
        if (!set.has(item))
            return;
        setInc((prev) => !prev);
        set.delete(item);
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setInc]);
    return [Array.from(set.values()), add, remove];
}
exports.default = useSet;
//# sourceMappingURL=useSet.js.map