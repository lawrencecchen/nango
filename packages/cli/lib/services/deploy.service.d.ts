import type { StandardNangoConfig, IncomingFlowConfig } from '@nangohq/shared';
import type { PostConnectionScriptByProvider } from '@nangohq/types';

import type { DeployOptions } from '../types.js';
declare class DeployService {
    admin({ fullPath, environmentName, debug }: { fullPath: string; environmentName: string; debug?: boolean }): Promise<void>;
    prep({ fullPath, options, environment, debug }: { fullPath: string; options: DeployOptions; environment: string; debug?: boolean }): Promise<void>;
    run(
        url: string,
        body: {
            flowConfigs: IncomingFlowConfig[];
            postConnectionScriptsByProvider: PostConnectionScriptByProvider[];
            nangoYamlBody: string | null;
            reconcile: boolean;
            debug: boolean;
            singleDeployMode?: boolean;
        }
    ): Promise<void>;
    package(
        config: StandardNangoConfig[],
        debug: boolean,
        version?: string,
        optionalSyncName?: string,
        optionalActionName?: string
    ): {
        flowConfigs: IncomingFlowConfig[];
        postConnectionScriptsByProvider: PostConnectionScriptByProvider[];
    } | null;
}
declare const deployService: DeployService;
export default deployService;
