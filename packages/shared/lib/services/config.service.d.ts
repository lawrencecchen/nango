import type { Template as ProviderTemplate } from '@nangohq/types';

import type { Config as ProviderConfig } from '../models/Provider.js';
import type { Orchestrator } from '../clients/orchestrator.js';
declare class ConfigService {
    templates: Record<string, ProviderTemplate> | null;
    constructor();
    private getTemplatesFromFile;
    getProviderName(providerConfigKey: string): Promise<string | null>;
    getIdByProviderConfigKey(environment_id: number, providerConfigKey: string): Promise<number | null>;
    getProviderConfigByUuid(providerConfigKey: string, environment_uuid: string): Promise<ProviderConfig | null>;
    getProviderConfig(providerConfigKey: string, environment_id: number): Promise<ProviderConfig | null>;
    listProviderConfigs(environment_id: number): Promise<ProviderConfig[]>;
    listProviderConfigsByProvider(environment_id: number, provider: string): Promise<ProviderConfig[]>;
    getAllNames(environment_id: number): Promise<string[]>;
    createProviderConfig(config: ProviderConfig): Promise<void | Pick<ProviderConfig, 'id'>[]>;
    createEmptyProviderConfig(provider: string, environment_id: number): Promise<Pick<ProviderConfig, 'id' | 'unique_key'>>;
    deleteProviderConfig(providerConfigKey: string, environment_id: number, orchestrator: Orchestrator): Promise<number>;
    editProviderConfig(config: ProviderConfig): Promise<any>;
    editProviderConfigName(providerConfigKey: string, newUniqueKey: string, environment_id: number): Promise<any>;
    checkProviderTemplateExists(provider: string): boolean;
    getTemplate(provider: string): ProviderTemplate;
    getTemplates(): Record<string, ProviderTemplate>;
    getConfigIdByProvider(
        provider: string,
        environment_id: number
    ): Promise<{
        id: number;
        unique_key: string;
    } | null>;
    getConfigIdByProviderConfigKey(providerConfigKey: string, environment_id: number): Promise<number | null>;
}
declare const _default: ConfigService;
export default _default;
