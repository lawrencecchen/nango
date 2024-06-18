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
const react_1 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
const classnames_1 = __importDefault(require("classnames"));
const CopyButton_1 = __importDefault(require("../button/CopyButton"));
const SecretInput = (0, react_1.forwardRef)(function PasswordField(_a, ref) {
    var _b, _c;
    var { className, copy, optionalvalue, setoptionalvalue, defaultValue, refresh } = _a, props = __rest(_a, ["className", "copy", "optionalvalue", "setoptionalvalue", "defaultValue", "refresh"]);
    const [isSecretVisible, setIsSecretVisible] = (0, react_1.useState)(false);
    const [changedValue, setChangedValue] = (0, react_1.useState)(defaultValue);
    const value = optionalvalue === null ? '' : optionalvalue || changedValue;
    const updateValue = setoptionalvalue || setChangedValue;
    const top = props.tall ? 'top-2.5' : 'top-0.5';
    const toggleSecretVisibility = (0, react_1.useCallback)(() => setIsSecretVisible(!isSecretVisible), [isSecretVisible, setIsSecretVisible]);
    return (<div className={`relative flex ${(_b = props.additionalclass) !== null && _b !== void 0 ? _b : ''}`}>
            <input type={isSecretVisible ? 'text' : 'password'} ref={ref} className={(0, classnames_1.default)('border-border-gray bg-active-gray text-text-light-gray focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-1 text-sm placeholder-gray-400 shadow-sm focus:outline-none', className)} value={value || ''} onChange={(e) => updateValue(e.currentTarget.value)} {...props}/>
            <span className={`absolute right-2 ${top} flex items-center bg-active-gray border-border-gray gap-2 h-6`}>
                <span onClick={toggleSecretVisibility} className="rounded text-sm text-gray-600 cursor-pointer">
                    {isSecretVisible ? <outline_1.EyeSlashIcon className="w-4 h-4"/> : <outline_1.EyeIcon className="w-4 h-4"/>}
                </span>
                {copy && <CopyButton_1.default text={((_c = (props.value || optionalvalue || defaultValue)) === null || _c === void 0 ? void 0 : _c.toString()) || ''} dark/>}
                {refresh && <outline_1.ArrowPathIcon className="flex h-4 w-4 cursor-pointer text-gray-500" onClick={refresh}/>}
            </span>
        </div>);
});
exports.default = SecretInput;
//# sourceMappingURL=SecretInput.js.map