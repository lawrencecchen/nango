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
const icons_1 = require("@geist-ui/icons");
const useSet_1 = __importDefault(require("../../../hooks/useSet"));
const TagsInput = (0, react_1.forwardRef)(function TagsInput(_a, ref) {
    var { className, defaultValue, selectedScopes: optionalSelectedScopes, addToScopesSet: optionalAddToScopesSet, removeFromSelectedSet: optionalRemoveFromSelectedSet } = _a, props = __rest(_a, ["className", "defaultValue", "selectedScopes", "addToScopesSet", "removeFromSelectedSet"]);
    const defaultScopes = (0, react_1.useMemo)(() => {
        return defaultValue ? defaultValue.split(',') : [];
    }, [defaultValue]);
    const [enteredValue, setEnteredValue] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)('');
    const [selectedScopes, addToScopesSet, removeFromSelectedSet] = (0, useSet_1.default)();
    const [scopes, setScopes] = (0, react_1.useState)(selectedScopes);
    const readOnly = props.readOnly || false;
    (0, react_1.useEffect)(() => {
        const selectedScopesStr = JSON.stringify(selectedScopes);
        const optionalSelectedScopesStr = JSON.stringify(optionalSelectedScopes);
        if (optionalSelectedScopesStr !== JSON.stringify(scopes)) {
            setScopes(optionalSelectedScopes !== null && optionalSelectedScopes !== void 0 ? optionalSelectedScopes : JSON.parse(selectedScopesStr));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(optionalSelectedScopes), JSON.stringify(selectedScopes)]);
    (0, react_1.useEffect)(() => {
        if (defaultScopes.length) {
            defaultScopes.forEach((scope) => {
                typeof optionalAddToScopesSet === 'function' ? optionalAddToScopesSet(scope.trim()) : addToScopesSet(scope.trim());
            });
        }
    }, [defaultScopes, addToScopesSet, optionalAddToScopesSet]);
    function handleEnter(e) {
        //quick check for empty inputs
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    }
    function handleAdd() {
        if (enteredValue.trim()) {
            if (enteredValue.includes(',')) {
                const enteredScopes = enteredValue.split(',');
                enteredScopes.forEach((scope) => {
                    typeof optionalAddToScopesSet === 'function' ? optionalAddToScopesSet(scope.trim()) : addToScopesSet(scope.trim());
                });
                setEnteredValue('');
                setError('');
                return;
            }
            typeof optionalAddToScopesSet === 'function' ? optionalAddToScopesSet(enteredValue.trim()) : addToScopesSet(enteredValue.trim());
            setEnteredValue('');
            setError('');
        }
    }
    function removeScope(scopeToBeRemoved) {
        typeof optionalRemoveFromSelectedSet === 'function' ? optionalRemoveFromSelectedSet(scopeToBeRemoved) : removeFromSelectedSet(scopeToBeRemoved);
    }
    function showInvalid() {
        //show error message only when developer sets this field to be a required one.
        if (props.required) {
            setError('Please enter at least one scope for this provider');
        }
    }
    return (<>
            {!readOnly && (<>
                    <div className="flex gap-3">
                        <input onInvalid={showInvalid} value={scopes.join(',')} {...props} hidden/>
                        <input ref={ref} value={enteredValue} onChange={(e) => setEnteredValue(e.currentTarget.value)} onKeyDown={handleEnter} placeholder={scopes.length ? '' : 'Find the list of scopes in the documentation of the external API provider.'} className="border-border-gray bg-active-gray text-white focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-0.5 text-sm placeholder-gray-400 shadow-sm focus:outline-none"/>
                    </div>
                    {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                    {enteredValue !== '' && (<div className="flex items-center border border-border-gray bg-active-gray text-white rounded-md px-3 py-0.5 mt-0.5 cursor-pointer" onClick={handleAdd}>
                            <outline_1.PlusSmallIcon className="h-5 w-5" onClick={handleAdd}/>
                            <span className="">Add new scope: &quot;{enteredValue}&quot;</span>
                        </div>)}
                </>)}
            {Boolean(scopes.length) && (<div className="pt-1 mb-3 flex flex-wrap space-x-2">
                    {scopes.map((selectedScope, i) => {
                return (<span key={selectedScope + i} className={`${!readOnly ? 'cursor-pointer ' : ''}flex flex-wrap gap-1 pl-4 pr-2 py-1 mt-0.5 justify-between items-center text-sm font-medium rounded-lg bg-green-600 bg-opacity-20 text-green-600`}>
                                {selectedScope}
                                {!readOnly && <icons_1.X onClick={() => removeScope(selectedScope)} className="h-5 w-5"/>}
                            </span>);
            })}
                </div>)}
        </>);
});
exports.default = TagsInput;
//# sourceMappingURL=TagsInput.js.map