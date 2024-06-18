import type { PostConnectionScriptByProvider } from '@nangohq/types';
import type { LogContextGetter } from '@nangohq/logs';

import type { ServiceResponse } from '../@nangohq/models/Generic.js';
import type { IncomingFlowConfig, SyncConfigResult, IncomingPreBuiltFlowConfig } from '../@nangohq/models/Sync.js';
import type { Environment } from '../@nangohq/models/Environment.js';
import type { Account } from '../@nangohq/models/Admin.js';
import type { Orchestrator } from '../../../clients/orchestrator.js';
export declare function deploy({
    environment,
    account,
    flows,
    postConnectionScriptsByProvider,
    nangoYamlBody,
    logContextGetter,
    orchestrator,
    debug
}: {
    environment: Environment;
    account: Account;
    flows: IncomingFlowConfig[];
    postConnectionScriptsByProvider: PostConnectionScriptByProvider[];
    nangoYamlBody: string;
    logContextGetter: LogContextGetter;
    orchestrator: Orchestrator;
    debug?: boolean;
}): Promise<ServiceResponse<SyncConfigResult | null>>;
export declare function deployPreBuilt(
    environment: Environment,
    configs: IncomingPreBuiltFlowConfig[],
    nangoYamlBody: string,
    logContextGetter: LogContextGetter,
    orchestrator: Orchestrator
): Promise<ServiceResponse<SyncConfigResult | null>>;
