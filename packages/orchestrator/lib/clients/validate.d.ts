import type { Schedule, Task } from '@nangohq/scheduler';
import { z } from 'zod';
import type { Result } from '@nangohq/utils';

import type { OrchestratorSchedule, OrchestratorTask } from './types.js';
export declare const commonSchemaArgsFields: {
    connection: z.ZodObject<
        {
            id: z.ZodNumber;
            connection_id: z.ZodString;
            provider_config_key: z.ZodString;
            environment_id: z.ZodNumber;
        },
        'strip',
        z.ZodTypeAny,
        {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        },
        {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        }
    >;
};
export declare const syncArgsSchema: z.ZodObject<
    {
        connection: z.ZodObject<
            {
                id: z.ZodNumber;
                connection_id: z.ZodString;
                provider_config_key: z.ZodString;
                environment_id: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
                id?: number;
                connection_id?: string;
                provider_config_key?: string;
                environment_id?: number;
            },
            {
                id?: number;
                connection_id?: string;
                provider_config_key?: string;
                environment_id?: number;
            }
        >;
        type: z.ZodLiteral<'sync'>;
        syncId: z.ZodString;
        syncName: z.ZodString;
        debug: z.ZodBoolean;
    },
    'strip',
    z.ZodTypeAny,
    {
        connection?: {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        };
        type?: 'sync';
        syncId?: string;
        syncName?: string;
        debug?: boolean;
    },
    {
        connection?: {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        };
        type?: 'sync';
        syncId?: string;
        syncName?: string;
        debug?: boolean;
    }
>;
export declare const actionArgsSchema: z.ZodObject<
    {
        connection: z.ZodObject<
            {
                id: z.ZodNumber;
                connection_id: z.ZodString;
                provider_config_key: z.ZodString;
                environment_id: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
                id?: number;
                connection_id?: string;
                provider_config_key?: string;
                environment_id?: number;
            },
            {
                id?: number;
                connection_id?: string;
                provider_config_key?: string;
                environment_id?: number;
            }
        >;
        type: z.ZodLiteral<'action'>;
        actionName: z.ZodString;
        activityLogId: z.ZodNumber;
        input: z.ZodType<import('type-fest').JsonValue, z.ZodTypeDef, import('type-fest').JsonValue>;
    },
    'strip',
    z.ZodTypeAny,
    {
        connection?: {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        };
        type?: 'action';
        actionName?: string;
        activityLogId?: number;
        input?: import('type-fest').JsonValue;
    },
    {
        connection?: {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        };
        type?: 'action';
        actionName?: string;
        activityLogId?: number;
        input?: import('type-fest').JsonValue;
    }
>;
export declare const webhookArgsSchema: z.ZodObject<
    {
        connection: z.ZodObject<
            {
                id: z.ZodNumber;
                connection_id: z.ZodString;
                provider_config_key: z.ZodString;
                environment_id: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
                id?: number;
                connection_id?: string;
                provider_config_key?: string;
                environment_id?: number;
            },
            {
                id?: number;
                connection_id?: string;
                provider_config_key?: string;
                environment_id?: number;
            }
        >;
        type: z.ZodLiteral<'webhook'>;
        webhookName: z.ZodString;
        parentSyncName: z.ZodString;
        activityLogId: z.ZodNumber;
        input: z.ZodType<import('type-fest').JsonValue, z.ZodTypeDef, import('type-fest').JsonValue>;
    },
    'strip',
    z.ZodTypeAny,
    {
        connection?: {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        };
        type?: 'webhook';
        webhookName?: string;
        parentSyncName?: string;
        activityLogId?: number;
        input?: import('type-fest').JsonValue;
    },
    {
        connection?: {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        };
        type?: 'webhook';
        webhookName?: string;
        parentSyncName?: string;
        activityLogId?: number;
        input?: import('type-fest').JsonValue;
    }
>;
export declare const postConnectionArgsSchema: z.ZodObject<
    {
        connection: z.ZodObject<
            {
                id: z.ZodNumber;
                connection_id: z.ZodString;
                provider_config_key: z.ZodString;
                environment_id: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
                id?: number;
                connection_id?: string;
                provider_config_key?: string;
                environment_id?: number;
            },
            {
                id?: number;
                connection_id?: string;
                provider_config_key?: string;
                environment_id?: number;
            }
        >;
        type: z.ZodLiteral<'post-connection-script'>;
        postConnectionName: z.ZodString;
        fileLocation: z.ZodString;
        activityLogId: z.ZodNumber;
    },
    'strip',
    z.ZodTypeAny,
    {
        connection?: {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        };
        type?: 'post-connection-script';
        postConnectionName?: string;
        fileLocation?: string;
        activityLogId?: number;
    },
    {
        connection?: {
            id?: number;
            connection_id?: string;
            provider_config_key?: string;
            environment_id?: number;
        };
        type?: 'post-connection-script';
        postConnectionName?: string;
        fileLocation?: string;
        activityLogId?: number;
    }
>;
export declare function validateTask(task: Task): Result<OrchestratorTask>;
export declare function validateSchedule(schedule: Schedule): Result<OrchestratorSchedule>;
