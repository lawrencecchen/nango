"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const react_1 = require("react");
const utils_1 = require("../../../utils/utils");
const Input = (0, react_1.forwardRef)((_a, ref) => {
    var { className, type, before, after } = _a, props = __rest(_a, ["className", "type", "before", "after"]);
    return (<div className={(0, utils_1.cn)('relative flex items-center bg-transparent w-full rounded border border-zinc-900 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}>
            {before && <div className="absolute text-text-light-gray px-2">{before}</div>}
            <input type={type} ref={ref} className={(0, utils_1.cn)('bg-transparent border-0 h-full px-3 py-[7px] w-full text-white file:border-0 file:bg-transparent file:text-sm file:font-medium outline-none', before && 'pl-8', after && 'pr-8')} {...props}/>
            {after && <div className="absolute right-0 text-text-light-gray px-2">{after}</div>}
        </div>);
});
exports.Input = Input;
Input.displayName = 'Input';
//# sourceMappingURL=Input.js.map