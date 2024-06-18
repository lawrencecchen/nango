"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypesSelect = void 0;
const react_1 = require("react");
const react_icons_1 = require("@radix-ui/react-icons");
const Button_1 = __importDefault(require("../../../components/ui/button/Button"));
const Popover_1 = require("../../../components/ui/Popover");
const Command_1 = require("../../../components/ui/Command");
const constants_1 = require("../constants");
const Input_1 = require("../../../components/ui/input/Input");
const utils_1 = require("../../../utils/utils");
const TypesSelect = ({ selected, onChange }) => {
    const [open, setOpen] = (0, react_1.useState)(false);
    const select = (val, checked) => {
        if (val === 'all') {
            onChange(['all']);
            return;
        }
        let tmp = checked ? [...selected, val] : selected.filter((sel) => sel !== val);
        const [type, action] = val.split(':');
        if (!action && checked) {
            // On check category, remove childs
            tmp = tmp.filter((sel) => !sel.startsWith(`${type}:`));
        }
        else if (action && checked) {
            // On check child, remove parent
            tmp = tmp.filter((sel) => sel !== type);
        }
        if (tmp.length > 1) {
            tmp = tmp.filter((sel) => sel !== 'all');
        }
        onChange(tmp.length <= 0 ? ['all'] : tmp);
    };
    const reset = (e) => {
        e.preventDefault();
        onChange(['all']);
    };
    const isDirty = (0, react_1.useMemo)(() => {
        return !(selected.length === 1 && selected[0] === 'all');
    }, [selected]);
    return (<Popover_1.Popover open={open} onOpenChange={setOpen}>
            <Popover_1.PopoverTrigger asChild>
                <Button_1.default variant="zombieGray" size={'xs'} className={(0, utils_1.cn)('text-text-light-gray', isDirty && 'text-white')}>
                    Type
                    {isDirty && (<button className="bg-pure-black text-white flex gap-1 items-center px-1.5 rounded-xl" onPointerDown={reset} onKeyDown={(e) => {
                if (['Enter', ' '].includes(e.key)) {
                    reset(e);
                }
            }}>
                            <react_icons_1.CrossCircledIcon />
                            {selected.length}
                        </button>)}
                </Button_1.default>
            </Popover_1.PopoverTrigger>
            <Popover_1.PopoverContent className="w-72 p-0 text-white bg-active-gray">
                <Command_1.Command>
                    <Command_1.CommandList className="max-h-none h-[415px]">
                        <Command_1.CommandEmpty>No framework found.</Command_1.CommandEmpty>
                        <Command_1.CommandGroup>
                            <Input_1.Input className="opacity-0 h-0"/>

                            {constants_1.typesOptions.map((parent) => {
            const checked = selected.some((sel) => parent.value === sel);
            return (<div key={parent.value}>
                                        <Command_1.CommandItem value={parent.value} onSelect={() => {
                    select(parent.value, !checked);
                }}>
                                            <Command_1.CommandCheck checked={checked}/>
                                            {parent.name}
                                        </Command_1.CommandItem>
                                        {parent.childs && (<div className="ml-4">
                                                {parent.childs.map((option) => {
                        const checked = selected.some((sel) => option.value === sel);
                        return (<Command_1.CommandItem key={option.value} value={option.value} onSelect={() => {
                                select(option.value, !checked);
                            }}>
                                                            <Command_1.CommandCheck checked={checked}/>
                                                            {option.name}
                                                        </Command_1.CommandItem>);
                    })}
                                            </div>)}
                                    </div>);
        })}
                        </Command_1.CommandGroup>
                    </Command_1.CommandList>
                </Command_1.Command>
            </Popover_1.PopoverContent>
        </Popover_1.Popover>);
};
exports.TypesSelect = TypesSelect;
//# sourceMappingURL=TypesSelect.js.map