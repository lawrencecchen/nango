import type { RecentlyCreatedConnection } from '@nangohq/shared';
import type { LogContextGetter } from '@nangohq/logs';
export declare function externalPostConnection(
    createdConnection: RecentlyCreatedConnection,
    provider: string,
    logContextGetter: LogContextGetter
): Promise<void>;
