import type { ApiError, Endpoint } from '../../api.ts.js';
import type { Metadata } from '../db.ts.js';

export interface MetadataBody {
    connection_id: string | string[];
    provider_config_key: string;
    metadata: Metadata;
}

type MetadataError = ApiError<'invalid_body'> | ApiError<'unknown_connection'>;

export type SetMetadata = Endpoint<{
    Method: 'POST';
    Body: MetadataBody;
    Path: '/connection/metadata';
    Error: MetadataError;
    Success: MetadataBody;
}>;

export type UpdateMetadata = Endpoint<{
    Method: 'PATCH';
    Path: '/connection/metadata';
    Body: MetadataBody;
    Error: MetadataError;
    Success: MetadataBody;
}>;
