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
exports.Calendar = void 0;
const react_day_picker_1 = require("react-day-picker");
const react_icons_1 = require("@radix-ui/react-icons");
const Button_1 = require("./button/Button");
const utils_1 = require("../../utils/utils");
function Calendar(_a) {
    var { className, classNames, showOutsideDays = true } = _a, props = __rest(_a, ["className", "classNames", "showOutsideDays"]);
    return (<react_day_picker_1.DayPicker showOutsideDays={showOutsideDays} className={(0, utils_1.cn)('p-3', className)} classNames={Object.assign({ months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0', month: 'space-y-4', caption: 'flex justify-center pt-1 relative items-center', caption_label: 'text-sm font-medium', nav: 'space-x-1 flex items-center', nav_button: (0, utils_1.cn)((0, Button_1.buttonStyles)({ variant: 'active' }), 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'), nav_button_previous: 'absolute left-1', nav_button_next: 'absolute right-1', table: 'w-full border-collapse space-y-1', head_row: 'flex', head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]', row: 'flex w-full mt-2', cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20', day: (0, utils_1.cn)('h-9 w-9 p-0 font-normal aria-selected:opacity-100'), day_range_end: 'day-range-end', day_selected: 'bg-pure-black text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground', day_today: 'bg-accent text-accent-foreground', day_outside: 'day-outside text-muted-foreground opacity-20 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30 disabled:opacity-5', day_disabled: 'text-muted-foreground opacity-20 disabled:opacity-10', day_range_middle: 'aria-selected:bg-pure-black aria-selected:text-accent-foreground', day_hidden: 'invisible' }, classNames)} components={{
            IconLeft: () => <react_icons_1.ChevronLeftIcon className="h-4 w-4"/>,
            IconRight: () => <react_icons_1.ChevronRightIcon className="h-4 w-4"/>
        }} {...props}/>);
}
exports.Calendar = Calendar;
Calendar.displayName = 'Calendar';
//# sourceMappingURL=Calendar.js.map