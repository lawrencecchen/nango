import type { NangoConfig, NangoIntegration, NangoSyncConfig, NangoModelV1, StandardNangoConfig } from '../models/NangoConfig.js';
export interface Config {
    integrations: NangoIntegration & NangoModelV1;
}
declare class FlowService {
    getAllAvailableFlows(): Config;
    getAllAvailableFlowsAsStandardConfig(): StandardNangoConfig[];
    getFlow(name: string): NangoSyncConfig;
    getSingleFlowAsStandardConfig(name: string): StandardNangoConfig | null;
    getActionAsNangoConfig(provider: string, name: string): NangoConfig | null;
    getPublicActionByPathAndMethod(provider: string, path: string, method: string): string | null;
    getAddedPublicFlows(environmentId: number): Promise<SyncConfig[]>;
}
declare const _default: FlowService;
export default _default;
