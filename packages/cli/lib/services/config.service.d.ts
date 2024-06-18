import type { StandardNangoConfig, ServiceResponse } from '@nangohq/shared';
declare class ConfigService {
    load(fullPath: string, debug?: boolean): Promise<ServiceResponse<StandardNangoConfig[]>>;
    getModelNames(config: StandardNangoConfig[]): string[];
    private validate;
}
declare const configService: ConfigService;
export default configService;
