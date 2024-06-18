/// <reference types="react" />
import type { DateRange } from 'react-day-picker';
export declare const DatePicker: React.FC<{
    isLive: boolean;
    period: DateRange;
    onChange: (selected: DateRange, live: boolean) => void;
}>;
