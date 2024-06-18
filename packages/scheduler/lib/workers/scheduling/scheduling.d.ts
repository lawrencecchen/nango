import type knex from 'knex';
import type { Result } from '@nangohq/utils';

import type { Schedule } from '../../types.js';
export declare function dueSchedules(db: knex.Knex): Promise<Result<Schedule[]>>;
