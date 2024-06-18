import type { JsonValue } from 'type-fest';
import type knex from 'knex';
import type { Result } from '@nangohq/utils';

import type { Schedule, ScheduleState } from '../types.js';
export declare const SCHEDULES_TABLE = 'schedules';
export declare const validScheduleStateTransitions: readonly [
    {
        readonly from: 'STARTED';
        readonly to: 'PAUSED';
    },
    {
        readonly from: 'STARTED';
        readonly to: 'DELETED';
    },
    {
        readonly from: 'PAUSED';
        readonly to: 'STARTED';
    },
    {
        readonly from: 'PAUSED';
        readonly to: 'DELETED';
    }
];
export declare type ValidScheduleStateTransitions = (typeof validScheduleStateTransitions)[number];
export interface DbSchedule {
    readonly id: string;
    readonly name: string;
    state: ScheduleState;
    readonly starts_at: Date;
    frequency: string;
    payload: JsonValue;
    readonly group_key: string;
    readonly retry_max: number;
    readonly created_to_started_timeout_secs: number;
    readonly started_to_completed_timeout_secs: number;
    readonly heartbeat_timeout_secs: number;
    readonly created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
export declare const DbSchedule: {
    to: (schedule: Schedule) => DbSchedule;
    from: (dbSchedule: DbSchedule) => Schedule;
};
export declare type ScheduleProps = Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export declare function create(db: knex.Knex, props: ScheduleProps): Promise<Result<Schedule>>;
export declare function get(db: knex.Knex, scheduleId: string): Promise<Result<Schedule>>;
export declare function transitionState(db: knex.Knex, scheduleId: string, to: ScheduleState): Promise<Result<Schedule>>;
export declare function update(
    db: knex.Knex,
    props: Partial<Pick<ScheduleProps, 'frequencyMs' | 'payload'>> & {
        id: string;
    }
): Promise<Result<Schedule>>;
export declare function remove(db: knex.Knex, id: string): Promise<Result<Schedule>>;
export declare function search(
    db: knex.Knex,
    params: {
        id?: string;
        names?: string[];
        state?: ScheduleState;
        limit: number;
        forUpdate?: boolean;
    }
): Promise<Result<Schedule[]>>;
