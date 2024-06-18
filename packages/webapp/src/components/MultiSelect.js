"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiSelect = void 0;
const react_1 = require("react");
const react_icons_1 = require("@radix-ui/react-icons");
const Button_1 = __importDefault(require("./ui/button/Button"));
const Popover_1 = require("./ui/Popover");
const Command_1 = require("./ui/Command");
const utils_1 = require("../utils/utils");
const MultiSelect = ({ label, options, selected, defaultSelect, all, onChange }) => {
    const [open, setOpen] = (0, react_1.useState)(false);
    const select = (val, checked) => {
        if (all && val === 'all') {
            onChange(['all']);
            return;
        }
        let tmp = checked ? [...selected, val] : selected.filter((sel) => sel !== val);
        if (all && tmp.length > 1) {
            tmp = tmp.filter((sel) => sel !== 'all');
        }
        onChange(tmp.length <= 0 ? [...defaultSelect] : tmp);
    };
    const reset = (e) => {
        e.preventDefault();
        if (all) {
            onChange(['all']);
        }
        else {
            onChange([...defaultSelect]);
        }
    };
    const isDirty = (0, react_1.useMemo)(() => {
        if (!all) {
            return selected.length !== options.length;
        }
        return !(selected.length === 1 && selected[0] === 'all');
    }, [selected, all, options]);
    return (<Popover_1.Popover open={open} onOpenChange={setOpen}>
            <Popover_1.PopoverTrigger asChild>
                <Button_1.default variant="zombieGray" size={'xs'} className={(0, utils_1.cn)('text-text-light-gray', isDirty && 'text-white')}>
                    {label}
                    {isDirty && (<button className="bg-pure-black text-text-light-gray flex gap-1 items-center px-1.5 rounded-xl" onPointerDown={reset} onKeyDown={(e) => {
                if (['Enter', ' '].includes(e.key)) {
                    reset(e);
                }
            }}>
                            <react_icons_1.CrossCircledIcon />
                            {selected.length}
                        </button>)}
                </Button_1.default>
            </Popover_1.PopoverTrigger>
            <Popover_1.PopoverContent className="w-56 p-0 text-white bg-active-gray" align="end">
                <Command_1.Command>
                    <Command_1.CommandList>
                        <Command_1.CommandEmpty>No framework found.</Command_1.CommandEmpty>
                        <Command_1.CommandGroup>
                            {options.map((option) => {
            const checked = selected.some((sel) => option.value === sel);
            return (<Command_1.CommandItem key={option.value} value={option.value} onSelect={() => {
                    select(option.value, !checked);
                }}>
                                        <Command_1.CommandCheck checked={checked}/>
                                        {option.name}
                                    </Command_1.CommandItem>);
        })}
                        </Command_1.CommandGroup>
                    </Command_1.CommandList>
                </Command_1.Command>
            </Popover_1.PopoverContent>
        </Popover_1.Popover>);
};
exports.MultiSelect = MultiSelect;
//# sourceMappingURL=MultiSelect.js.map