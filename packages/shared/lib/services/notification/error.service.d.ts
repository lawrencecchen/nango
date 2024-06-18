import type { Knex } from 'knex';
import type { ActiveLog } from '@nangohq/types';
import type { Result } from '@nangohq/utils';
declare type ErrorNotification = Required<Pick<ActiveLog, 'type' | 'action' | 'connection_id' | 'activity_log_id' | 'log_id' | 'active'>>;
declare type SyncErrorNotification = ErrorNotification & Required<Pick<ActiveLog, 'sync_id'>>;
export declare const errorNotificationService: {
    auth: {
        create: ({ type, action, connection_id, activity_log_id, log_id, active }: ErrorNotification) => Promise<Result<ActiveLog>>;
        get: (id: number) => Promise<ActiveLog | null>;
        clear: ({ connection_id, trx }: { connection_id: ActiveLog['connection_id']; trx?: Knex.Transaction | Knex }) => Promise<void>;
    };
    sync: {
        create: ({ type, action, sync_id, connection_id, activity_log_id, log_id, active }: SyncErrorNotification) => Promise<Result<ActiveLog>>;
        clear: ({
            sync_id,
            connection_id,
            trx
        }: {
            sync_id: ActiveLog['sync_id'];
            connection_id: ActiveLog['connection_id'];
            trx?: Knex.Transaction | Knex;
        }) => Promise<void>;
        clearBySyncId: ({ sync_id }: Pick<SyncErrorNotification, 'sync_id'>) => Promise<void>;
    };
};
export {};
