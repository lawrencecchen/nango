import type { estypes } from '@elastic/elasticsearch';
export declare function getDailyIndexPipeline(name: string): estypes.IngestPutPipelineRequest;
export declare function policyRetention(): estypes.IlmPutLifecycleRequest;
export declare const indexMessages: estypes.IndicesCreateRequest;
