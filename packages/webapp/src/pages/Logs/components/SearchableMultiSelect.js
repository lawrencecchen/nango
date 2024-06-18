"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchableMultiSelect = void 0;
const react_1 = require("react");
const react_icons_1 = require("@radix-ui/react-icons");
const react_use_1 = require("react-use");
const Button_1 = __importDefault(require("../../../components/ui/button/Button"));
const useLogs_1 = require("../../../hooks/useLogs");
const store_1 = require("../../../store");
const Input_1 = require("../../../components/ui/input/Input");
const Spinner_1 = __importDefault(require("../../../components/ui/Spinner"));
const Popover_1 = require("../../../components/ui/Popover");
const Command_1 = require("../../../components/ui/Command");
const utils_1 = require("../../../utils/utils");
const SearchableMultiSelect = ({ label, category, selected, onChange }) => {
    const env = (0, store_1.useStore)((state) => state.env);
    const [open, setOpen] = (0, react_1.useState)(false);
    const [search, setSearch] = (0, react_1.useState)('');
    const [debouncedSearch, setDebouncedSearch] = (0, react_1.useState)();
    const { data, loading, trigger } = (0, useLogs_1.useSearchFilters)(open, env, { category, search: debouncedSearch });
    (0, react_use_1.useDebounce)(() => setDebouncedSearch(search), 250, [search]);
    const select = (val, checked) => {
        if (val === 'all') {
            onChange(['all']);
            return;
        }
        let tmp = checked ? [...selected, val] : selected.filter((sel) => sel !== val);
        if (tmp.length > 1) {
            tmp = tmp.filter((sel) => sel !== 'all');
        }
        onChange(tmp.length <= 0 ? ['all'] : tmp);
    };
    const reset = (e) => {
        e.preventDefault();
        onChange(['all']);
    };
    const options = (0, react_1.useMemo)(() => {
        const tmp = [{ value: 'all', name: 'All' }];
        if (!data) {
            return tmp;
        }
        for (const item of data.data) {
            tmp.push({ value: item.key, name: item.key });
        }
        return tmp;
    }, [data]);
    const isDirty = (0, react_1.useMemo)(() => {
        return !(selected.length === 1 && selected[0] === 'all');
    }, [selected]);
    (0, react_1.useEffect)(() => {
        if (open && !data) {
            trigger();
        }
        if (!open) {
            setSearch('');
        }
    }, [open, data]);
    return (<Popover_1.Popover open={open} onOpenChange={setOpen}>
            <Popover_1.PopoverTrigger asChild>
                <Button_1.default variant="zombieGray" size={'xs'} className={(0, utils_1.cn)('text-text-light-gray', isDirty && 'text-white')}>
                    {label}
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
            <Popover_1.PopoverContent className="p-0 text-white bg-active-gray w-80" align="end">
                <Command_1.Command>
                    <Input_1.Input before={<react_icons_1.MagnifyingGlassIcon className="w-4 h-4"/>} after={loading && <Spinner_1.default size={1}/>} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus className="border-b border-b-border-gray-400 py-1"/>
                    <Command_1.CommandList>
                        <Command_1.CommandEmpty>No framework found.</Command_1.CommandEmpty>
                        <Command_1.CommandGroup>
                            {options.map((option) => {
            const checked = selected.some((sel) => option.value === sel);
            return (<Command_1.CommandItem key={option.value} value={option.value} onSelect={() => {
                    select(option.value, !checked);
                }} className="group">
                                        <Command_1.CommandCheck checked={checked}/>
                                        <div className="overflow-hidden">
                                            <div className="whitespace-pre w-fit">
                                                <div className={(0, utils_1.cn)(option.name.length > 39 && 'duration-[2000ms] group-hover:translate-x-[calc(-100%+258px)]')}>
                                                    {option.name}
                                                </div>
                                            </div>
                                        </div>
                                    </Command_1.CommandItem>);
        })}
                        </Command_1.CommandGroup>
                    </Command_1.CommandList>
                </Command_1.Command>
            </Popover_1.PopoverContent>
        </Popover_1.Popover>);
};
exports.SearchableMultiSelect = SearchableMultiSelect;
//# sourceMappingURL=SearchableMultiSelect.js.map