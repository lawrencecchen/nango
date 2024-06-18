import type { NangoModel, NangoIntegration } from '@nangohq/shared';
declare class ModelService {
    build(models: NangoModel, integrations: NangoIntegration, debug?: boolean): (string | undefined)[] | null;
    private getFieldType;
    createModelFile({ fullPath }: { fullPath: string }): Promise<void>;
}
declare const modelService: ModelService;
export default modelService;
