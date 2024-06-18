"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatePicker = void 0;
const react_1 = require("react");
const react_icons_1 = require("@radix-ui/react-icons");
const date_fns_1 = require("date-fns");
const Popover_1 = require("../../../components/ui/Popover");
const utils_1 = require("../../../utils/utils");
const Button_1 = __importDefault(require("../../../components/ui/button/Button"));
const Calendar_1 = require("../../../components/ui/Calendar");
const logs_1 = require("../../../utils/logs");
const DatePicker = ({ isLive, period, onChange }) => {
    const [selectedPreset, setSelectedPreset] = (0, react_1.useState)(null);
    const [synced, setSynced] = (0, react_1.useState)(false);
    const [date, setDate] = (0, react_1.useState)();
    const [tmpDate, setTmpDate] = (0, react_1.useState)();
    const defaultMonth = (0, react_1.useMemo)(() => {
        const today = new Date();
        return today.getDate() > 15 ? today : (0, date_fns_1.addMonths)(today, -1);
    }, []);
    const disabledBefore = (0, react_1.useMemo)(() => {
        return (0, date_fns_1.addDays)(new Date(), -14);
    }, []);
    const disabledAfter = (0, react_1.useMemo)(() => {
        return new Date();
    }, []);
    const display = (0, react_1.useMemo)(() => {
        if (selectedPreset !== null) {
            return selectedPreset.label;
        }
        if (!date || !date.from || !date.to) {
            return 'Last 24 hours';
        }
        if (date.from && date.to) {
            return `${(0, date_fns_1.format)(date.from, 'LLL dd, HH:mm')} - ${(0, date_fns_1.format)(date.to, 'LLL dd, HH:mm')}`;
        }
        return (0, date_fns_1.format)(date.from, 'LLL dd, HH:mm');
    }, [date, selectedPreset]);
    const onClickPreset = (preset) => {
        const range = (0, logs_1.getPresetRange)(preset.name);
        setSelectedPreset(preset);
        setTmpDate(range);
        onChange(range, true);
    };
    const onClickCalendar = (e) => {
        if (e === null || e === void 0 ? void 0 : e.from) {
            e.from.setHours(0, 0, 0);
        }
        if (e === null || e === void 0 ? void 0 : e.to) {
            e.to.setHours(23, 59, 59);
        }
        setTmpDate(e);
        if ((e === null || e === void 0 ? void 0 : e.from) && (e === null || e === void 0 ? void 0 : e.to)) {
            // Commit change only on full range
            onChange(e, e.to.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]);
        }
        if (!(e === null || e === void 0 ? void 0 : e.from) && !(e === null || e === void 0 ? void 0 : e.to)) {
            // Unselected everything should fallback to default preset
            onClickPreset({ label: 'Last 24 hours', name: 'last24h' });
        }
        else {
            setSelectedPreset(null);
        }
    };
    (0, react_1.useEffect)(function initialSync() {
        if (synced) {
            return;
        }
        setSynced(true);
        setDate(period);
        setTmpDate(period);
        setSelectedPreset((0, logs_1.matchPresetFromRange)(period));
    }, [period]);
    (0, react_1.useEffect)(function syncFromParent() {
        if (!synced) {
            return;
        }
        setDate(period);
    }, [period]);
    return (<Popover_1.Popover>
            <Popover_1.PopoverTrigger asChild>
                <Button_1.default variant="zombieGray" size={'xs'} className={(0, utils_1.cn)('flex-grow truncate text-text-light-gray', period && (selectedPreset === null || selectedPreset === void 0 ? void 0 : selectedPreset.name) !== 'last24h' && 'text-white')}>
                    <react_icons_1.CalendarIcon />
                    {display} {isLive && '(live)'}
                </Button_1.default>
            </Popover_1.PopoverTrigger>
            <Popover_1.PopoverContent className="w-auto p-0 text-white bg-active-gray" align="end">
                <div className="flex gap-6">
                    <Calendar_1.Calendar mode="range" defaultMonth={defaultMonth} selected={tmpDate} onSelect={onClickCalendar} initialFocus numberOfMonths={2} disabled={{ before: disabledBefore, after: disabledAfter }} weekStartsOn={1} showOutsideDays={false}/>
                    <div className="flex flex-col mt-6">
                        {logs_1.presets.map((preset) => {
            return (<Button_1.default key={preset.name} variant={'zombieGray'} className={(0, utils_1.cn)('justify-end', (selectedPreset === null || selectedPreset === void 0 ? void 0 : selectedPreset.name) === preset.name && 'bg-pure-black')} onClick={() => onClickPreset(preset)}>
                                    {preset.label}
                                </Button_1.default>);
        })}
                    </div>
                </div>
            </Popover_1.PopoverContent>
        </Popover_1.Popover>);
};
exports.DatePicker = DatePicker;
{
    /*  */
}
//# sourceMappingURL=DatePicker.js.map