/// <reference types="express" resolution-mode="require"/>
import type { ApiError, MetadataBody } from '@nangohq/types';
export declare const updateMetadata: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | MetadataBody
    | (ApiError<'invalid_body', undefined, unknown> | ApiError<'unknown_connection', undefined, unknown>),
    MetadataBody,
    unknown,
    Required<import('../../utils/express.js').RequestLocals>
>;
