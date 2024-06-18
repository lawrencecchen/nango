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
const SecretTextarea = (0, react_1.forwardRef)(function SecretTextarea(_a, ref) {
    var { className, copy, optionalvalue, setoptionalvalue, additionalclass, defaultValue } = _a, rest = __rest(_a, ["className", "copy", "optionalvalue", "setoptionalvalue", "additionalclass", "defaultValue"]);
    const [isSecretVisible, setIsSecretVisible] = (0, react_1.useState)(false);
    const [changedValue, setChangedValue] = (0, react_1.useState)(defaultValue);
    const value = optionalvalue || changedValue;
    const updateValue = setoptionalvalue || setChangedValue;
    const toggleSecretVisibility = (0, react_1.useCallback)(() => setIsSecretVisible(!isSecretVisible), [isSecretVisible]);
    const handleTextareaChange = (e) => {
        updateValue(e.currentTarget.value);
    };
    return (<div className={`relative flex ${additionalclass !== null && additionalclass !== void 0 ? additionalclass : ''}`}>
            {isSecretVisible ? (<textarea ref={ref} className={(0, classnames_1.default)('border-border-gray bg-bg-black text-text-light-gray focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-400 shadow-sm focus:outline-none', className, 'h-48')} value={value} onChange={handleTextareaChange} {...rest}/>) : (<input type="password" value={value} 
        // @ts-expect-error we are mixing input and textarea props
        onChange={(e) => updateValue(e.currentTarget.value)} autoComplete="new-password" className={(0, classnames_1.default)('border-border-gray bg-active-gray text-text-light-gray focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-0.6 text-sm placeholder-gray-400 shadow-sm focus:outline-none', className)} {...rest}/>)}
            <span className="absolute right-1 top-1.5 flex items-center bg-active-gray border-border-gray">
                <span onClick={toggleSecretVisibility} className="rounded px-2 py-1 text-sm text-gray-600 cursor-pointer">
                    {isSecretVisible ? <outline_1.EyeSlashIcon className="w-4 h-4 ml-1"/> : <outline_1.EyeIcon className="w-4 h-4 ml-1"/>}
                </span>
                {copy && <CopyButton_1.default text={value} dark/>}
            </span>
        </div>);
});
exports.default = SecretTextarea;
//# sourceMappingURL=SecretTextArea.js.map