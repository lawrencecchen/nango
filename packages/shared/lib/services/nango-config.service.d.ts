import type { StringValue } from 'ms';

import type { NangoConfig, NangoConfigV1, NangoConfigV2, StandardNangoConfig } from '../models/NangoConfig.js';
import type { ServiceResponse } from '../models/Generic.js';
export declare const nangoConfigFile = 'nango.yaml';
export declare const SYNC_FILE_EXTENSION = 'js';
interface IntervalResponse {
    interval: StringValue;
    offset: number;
}
export declare function loadLocalNangoConfig(loadLocation?: string): Promise<NangoConfig | null>;
export declare function determineVersion(configData: NangoConfig): 'v1' | 'v2';
export declare function loadStandardConfig(
    configData: NangoConfig,
    showMessages?: boolean,
    isPublic?: boolean | null
): ServiceResponse<StandardNangoConfig[] | null>;
export declare function convertConfigObject(config: NangoConfigV1): ServiceResponse<StandardNangoConfig[]>;
export declare function convertV2ConfigObject(config: NangoConfigV2, showMessages?: boolean, isPublic?: boolean | null): ServiceResponse<StandardNangoConfig[]>;
export declare function getOffset(interval: StringValue, date: Date): number;
/**
 * Get Interval
 * @desc get the interval based on the runs property in the yaml. The offset
 * should be the amount of time that the interval should be offset by.
 * If the time is 1536 and the interval is 30m then the next time the sync should run is 1606
 * and then 1636 etc. The offset should be based on the interval and should never be
 * greater than the interval
 */
export declare function getInterval(runs: string, date: Date): ServiceResponse<IntervalResponse>;
export {};
