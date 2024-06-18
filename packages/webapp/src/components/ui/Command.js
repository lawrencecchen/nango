"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.CommandCheck = exports.CommandSeparator = exports.CommandShortcut = exports.CommandItem = exports.CommandGroup = exports.CommandEmpty = exports.CommandList = exports.CommandInput = exports.CommandDialog = exports.Command = void 0;
const React = __importStar(require("react"));
const cmdk_1 = require("cmdk");
const react_icons_1 = require("@radix-ui/react-icons");
const Dialog_1 = require("./Dialog");
const utils_1 = require("../../utils/utils");
const Command = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<cmdk_1.Command ref={ref} className={(0, utils_1.cn)('flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', className)} {...props}/>);
});
exports.Command = Command;
Command.displayName = cmdk_1.Command.displayName;
const CommandDialog = (_a) => {
    var { children } = _a, props = __rest(_a, ["children"]);
    return (<Dialog_1.Dialog {...props}>
            <Dialog_1.DialogContent className="overflow-hidden p-0 shadow-lg">
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    {children}
                </Command>
            </Dialog_1.DialogContent>
        </Dialog_1.Dialog>);
};
exports.CommandDialog = CommandDialog;
const CommandInput = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (
    // eslint-disable-next-line react/no-unknown-property
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <cmdk_1.Command.Input ref={ref} className={(0, utils_1.cn)('flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}/>
        </div>);
});
exports.CommandInput = CommandInput;
CommandInput.displayName = cmdk_1.Command.Input.displayName;
const CommandList = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<cmdk_1.Command.List ref={ref} className={(0, utils_1.cn)('max-h-[300px] overflow-y-auto overflow-x-hidden', className)} {...props}/>);
});
exports.CommandList = CommandList;
CommandList.displayName = cmdk_1.Command.List.displayName;
const CommandEmpty = React.forwardRef((props, ref) => <cmdk_1.Command.Empty ref={ref} className="py-6 text-center text-sm" {...props}/>);
exports.CommandEmpty = CommandEmpty;
CommandEmpty.displayName = cmdk_1.Command.Empty.displayName;
const CommandGroup = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<cmdk_1.Command.Group ref={ref} className={(0, utils_1.cn)('overflow-hidden p-2.5 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground', className)} {...props}/>);
});
exports.CommandGroup = CommandGroup;
CommandGroup.displayName = cmdk_1.Command.Group.displayName;
const CommandSeparator = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return <cmdk_1.Command.Separator ref={ref} className={(0, utils_1.cn)('-mx-1 h-px bg-border', className)} {...props}/>;
});
exports.CommandSeparator = CommandSeparator;
CommandSeparator.displayName = cmdk_1.Command.Separator.displayName;
const CommandItem = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<cmdk_1.Command.Item ref={ref} className={(0, utils_1.cn)('px-2 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 text-gray-400 relative flex cursor-pointer rounded select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none transition-colors aria-selected:bg-pure-black aria-selected:text-white', className)} {...props}/>);
});
exports.CommandItem = CommandItem;
CommandItem.displayName = cmdk_1.Command.Item.displayName;
const CommandShortcut = (_a) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return <span className={(0, utils_1.cn)('ml-auto text-xs tracking-widest text-muted-foreground', className)} {...props}/>;
};
exports.CommandShortcut = CommandShortcut;
CommandShortcut.displayName = 'CommandShortcut';
// Custom
const CommandCheck = React.forwardRef(({ className, checked }, ref) => (<span ref={ref} className={(0, utils_1.cn)('absolute left-2 flex h-3.5 w-3.5 items-center justify-center border border-neutral-700 rounded-sm', checked && 'border-transparent', className)}>
            {checked && <react_icons_1.CheckIcon className="h-5 w-5"/>}
        </span>));
exports.CommandCheck = CommandCheck;
CommandCheck.displayName = 'CommandCheck';
//# sourceMappingURL=Command.js.map