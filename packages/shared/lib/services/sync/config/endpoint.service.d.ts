import type { NangoConnection } from '../@nangohq/models/Connection.js';
import type { HTTP_VERB } from '../@nangohq/models/Generic.js';
interface ActionOrModel {
    action?: string;
    model?: string;
}
export declare function getActionOrModelByEndpoint(nangoConnection: NangoConnection, method: HTTP_VERB, path: string): Promise<ActionOrModel>;
export declare function getOpenApiSpec(environment_id: number): Promise<string>;
export {};
