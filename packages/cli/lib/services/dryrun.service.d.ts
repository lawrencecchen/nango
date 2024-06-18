import type { Metadata } from '@nangohq/types';

import type { GlobalOptions } from '../types.js';
interface RunArgs extends GlobalOptions {
    sync: string;
    connectionId: string;
    lastSyncDate?: string;
    useServerLastSyncDate?: boolean;
    input?: object;
    metadata?: Metadata;
    optionalEnvironment?: string;
    optionalProviderConfigKey?: string;
}
declare class DryRunService {
    environment?: string;
    returnOutput?: boolean;
    constructor(environment?: string, returnOutput?: boolean);
    run(options: RunArgs, debug?: boolean): Promise<string | void>;
}
declare const dryRunService: DryRunService;
export default dryRunService;
