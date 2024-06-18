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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const outline_1 = require("@heroicons/react/24/outline");
const prism_1 = require("@mantine/prism");
const classnames_1 = __importDefault(require("classnames"));
const react_1 = require("react");
//just Prism component with some additional powers!
function PrismPlus(_a) {
    var { children } = _a, props = __rest(_a, ["children"]);
    const [isSecretVisible, setIsSecretVisible] = (0, react_1.useState)(false);
    const toggleSecretVisibility = (0, react_1.useCallback)(() => setIsSecretVisible(!isSecretVisible), [isSecretVisible, setIsSecretVisible]);
    const Switch = (0, react_1.useCallback)(() => {
        return (<span onClick={toggleSecretVisibility} className="rounded px-1 py-1 text-sm text-gray-600 cursor-pointer absolute z-10 -top-7 right-3">
                {isSecretVisible ? <outline_1.EyeSlashIcon className="w-5 h-5"/> : <outline_1.EyeIcon className="w-5 h-5"/>}
            </span>);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSecretVisible]);
    return (<div className="relative">
            {isSecretVisible ? (<Switch />) : (<div className={(0, classnames_1.default)('absolute z-10', { 'h-full w-full backdrop-blur-sm bg-black/0': !isSecretVisible })}>
                    <Switch />
                </div>)}

            <prism_1.Prism {...props}>{children}</prism_1.Prism>
        </div>);
}
exports.default = PrismPlus;
//# sourceMappingURL=PrismPlus.js.map