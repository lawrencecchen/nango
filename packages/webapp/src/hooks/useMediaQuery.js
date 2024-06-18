"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMediaQuery = void 0;
const react_1 = require("react");
function useMediaQuery(query) {
    const [value, setValue] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        function onChange(event) {
            setValue(event.matches);
        }
        const result = matchMedia(query);
        result.addEventListener('change', onChange);
        setValue(result.matches);
        return () => {
            result.removeEventListener('change', onChange);
        };
    }, [query]);
    return value;
}
exports.useMediaQuery = useMediaQuery;
//# sourceMappingURL=useMediaQuery.js.map