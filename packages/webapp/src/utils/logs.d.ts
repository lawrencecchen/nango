import type { SearchOperations, SearchOperationsPeriod } from '@nangohq/types';
import type { DateRange } from 'react-day-picker';
export declare function getLogsUrl(
    options: Omit<
        Partial<{
            [P in keyof SearchOperations['Body']]?: string | undefined;
        }>,
        'period'
    > & {
        operationId?: string | null | number;
        env: string;
        day?: Date;
    }
): string;
export declare function slidePeriod(period: DateRange | SearchOperationsPeriod): DateRange;
export declare const presets: readonly [
    {
        readonly name: 'last5m';
        readonly label: 'Last 5 minutes';
    },
    {
        readonly name: 'last1h';
        readonly label: 'Last hour';
    },
    {
        readonly name: 'last24h';
        readonly label: 'Last 24 hours';
    },
    {
        readonly name: 'last3d';
        readonly label: 'Last 3 days';
    },
    {
        readonly name: 'last7d';
        readonly label: 'Last 7 days';
    },
    {
        readonly name: 'last14d';
        readonly label: 'Last 14 days';
    }
];
export declare type PresetNames = (typeof presets)[number]['name'];
export declare type Preset = (typeof presets)[number];
export declare function getPresetRange(preset: PresetNames): DateRange;
export declare function matchPresetFromRange(range: DateRange): Preset | null;
