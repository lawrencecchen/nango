var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Ok, Err, stringifyError } from '@nangohq/utils';
import { uuidv7 } from 'uuidv7';
import { taskStates } from '../types.js';
export const TASKS_TABLE = 'tasks';
export const validTaskStateTransitions = [
    { from: 'CREATED', to: 'STARTED' },
    { from: 'CREATED', to: 'CANCELLED' },
    { from: 'CREATED', to: 'EXPIRED' },
    { from: 'STARTED', to: 'SUCCEEDED' },
    { from: 'STARTED', to: 'FAILED' },
    { from: 'STARTED', to: 'CANCELLED' },
    { from: 'STARTED', to: 'EXPIRED' }
];
const validToStates = taskStates.filter((state) => {
    return validTaskStateTransitions.every((transition) => transition.from !== state);
});
const TaskStateTransition = {
    validate({ from, to }) {
        const transition = validTaskStateTransitions.find((t) => t.from === from && t.to === to);
        if (transition) {
            return Ok(transition);
        }
        else {
            return Err(new Error(`Invalid state transition from ${from} to ${to}`));
        }
    }
};
export const DbTask = {
    to: (task) => {
        return {
            id: task.id,
            name: task.name,
            payload: task.payload,
            group_key: task.groupKey,
            retry_max: task.retryMax,
            retry_count: task.retryCount,
            starts_after: task.startsAfter,
            created_to_started_timeout_secs: task.createdToStartedTimeoutSecs,
            started_to_completed_timeout_secs: task.startedToCompletedTimeoutSecs,
            heartbeat_timeout_secs: task.heartbeatTimeoutSecs,
            created_at: task.createdAt,
            state: task.state,
            last_state_transition_at: task.lastStateTransitionAt,
            last_heartbeat_at: task.lastHeartbeatAt,
            output: task.output,
            terminated: task.terminated,
            schedule_id: task.scheduleId
        };
    },
    from: (dbTask) => {
        return {
            id: dbTask.id,
            name: dbTask.name,
            payload: dbTask.payload,
            groupKey: dbTask.group_key,
            retryMax: dbTask.retry_max,
            retryCount: dbTask.retry_count,
            startsAfter: dbTask.starts_after,
            createdToStartedTimeoutSecs: dbTask.created_to_started_timeout_secs,
            startedToCompletedTimeoutSecs: dbTask.started_to_completed_timeout_secs,
            heartbeatTimeoutSecs: dbTask.heartbeat_timeout_secs,
            createdAt: dbTask.created_at,
            state: dbTask.state,
            lastStateTransitionAt: dbTask.last_state_transition_at,
            lastHeartbeatAt: dbTask.last_heartbeat_at,
            output: dbTask.output,
            terminated: dbTask.terminated,
            scheduleId: dbTask.schedule_id
        };
    }
};
export function create(db, taskProps) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const newTask = Object.assign(Object.assign({}, taskProps), { id: uuidv7(), createdAt: now, state: 'CREATED', lastStateTransitionAt: now, lastHeartbeatAt: now, terminated: false, output: null, scheduleId: taskProps.scheduleId });
        try {
            const inserted = yield db.from(TASKS_TABLE).insert(DbTask.to(newTask)).returning('*');
            if (!(inserted === null || inserted === void 0 ? void 0 : inserted[0])) {
                return Err(new Error(`Error: no task '${taskProps.name}' created`));
            }
            return Ok(DbTask.from(inserted[0]));
        }
        catch (err) {
            return Err(new Error(`Error creating task '${taskProps.name}': ${stringifyError(err)}`));
        }
    });
}
export function get(db, taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = yield db.from(TASKS_TABLE).where('id', taskId).first();
        if (!task) {
            return Err(new Error(`Task with id '${taskId}' not found`));
        }
        return Ok(DbTask.from(task));
    });
}
export function search(db, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = db.from(TASKS_TABLE);
        if (params === null || params === void 0 ? void 0 : params.ids) {
            query.whereIn('id', params.ids);
        }
        if (params === null || params === void 0 ? void 0 : params.groupKey) {
            query.where('group_key', params.groupKey);
        }
        if (params === null || params === void 0 ? void 0 : params.states) {
            query.whereIn('state', params.states);
        }
        if (params === null || params === void 0 ? void 0 : params.scheduleId) {
            query.where('schedule_id', params.scheduleId);
        }
        const limit = (params === null || params === void 0 ? void 0 : params.limit) || 100;
        const tasks = yield query.limit(limit).orderBy('id');
        return Ok(tasks.map(DbTask.from));
    });
}
export function heartbeat(db, taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const updated = yield db.from(TASKS_TABLE).where('id', taskId).update({ last_heartbeat_at: new Date() }).returning('*');
            if (!(updated === null || updated === void 0 ? void 0 : updated[0])) {
                return Err(new Error(`Error: Task with id '${taskId}' not updated`));
            }
            return Ok(DbTask.from(updated[0]));
        }
        catch (err) {
            return Err(new Error(`Error updating task ${taskId}: ${stringifyError(err)}`));
        }
    });
}
export function transitionState(db, props) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = yield get(db, props.taskId);
        if (task.isErr()) {
            return Err(new Error(`Task with id '${props.taskId}' not found`));
        }
        const transition = TaskStateTransition.validate({ from: task.value.state, to: props.newState });
        if (transition.isErr()) {
            return Err(transition.error);
        }
        const output = 'output' in props ? props.output : null;
        const asPostgresJson = (val) => {
            if (val === null) {
                return null;
            }
            if (Array.isArray(val)) {
                // https://github.com/brianc/node-postgres/issues/442
                return JSON.stringify(val);
            }
            switch (typeof val) {
                case 'string': {
                    return db.raw(`to_json(?::text)`, [val]);
                }
                default:
                    return db.raw(`to_json(?::json)`, [val]);
            }
        };
        const updated = yield db
            .from(TASKS_TABLE)
            .where('id', props.taskId)
            .update({
            state: transition.value.to,
            last_state_transition_at: new Date(),
            terminated: validToStates.includes(transition.value.to),
            output: asPostgresJson(output)
        })
            .returning('*');
        if (!(updated === null || updated === void 0 ? void 0 : updated[0])) {
            return Err(new Error(`Task with id '${props.taskId}' not found`));
        }
        return Ok(DbTask.from(updated[0]));
    });
}
export function dequeue(db, { groupKey, limit }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tasks = yield db
                .update({
                state: 'STARTED',
                last_state_transition_at: new Date()
            })
                .from(TASKS_TABLE)
                .whereIn('id', db
                .select('id')
                .from(TASKS_TABLE)
                .where({ group_key: groupKey, state: 'CREATED' })
                .where('starts_after', '<=', db.fn.now())
                .orderBy('id')
                .limit(limit)
                .forUpdate()
                .skipLocked())
                .returning('*');
            if (!(tasks === null || tasks === void 0 ? void 0 : tasks[0])) {
                return Ok([]);
            }
            // Sort tasks by id (uuidv7) to ensure ordering by creation date
            const sorted = tasks.sort((a, b) => a.id.localeCompare(b.id)).map(DbTask.from);
            return Ok(sorted);
        }
        catch (err) {
            return Err(new Error(`Error dequeuing tasks for group key '${groupKey}': ${stringifyError(err)}`));
        }
    });
}
export function expiresIfTimeout(db) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tasks = yield db
                .update({
                state: 'EXPIRED',
                last_state_transition_at: new Date(),
                terminated: true,
                output: db.raw(`
                    CASE
                        WHEN state = 'CREATED' AND starts_after + created_to_started_timeout_secs * INTERVAL '1 seconds' < CURRENT_TIMESTAMP THEN '{"reason": "createdToStartedTimeoutSecs_exceeded"}'
                        WHEN state = 'STARTED' AND last_heartbeat_at + heartbeat_timeout_secs * INTERVAL '1 seconds' < CURRENT_TIMESTAMP THEN '{"reason": "heartbeatTimeoutSecs_exceeded"}'
                        WHEN state = 'STARTED' AND last_state_transition_at + started_to_completed_timeout_secs * INTERVAL '1 seconds' < CURRENT_TIMESTAMP THEN '{"reason": "startedToCompletedTimeoutSecs_exceeded"}'
                        ELSE output
                    END
                `)
            })
                .from(TASKS_TABLE)
                .whereIn('id', db
                .select('id')
                .from(TASKS_TABLE)
                .where((builder) => {
                builder
                    .where({ state: 'CREATED' })
                    .andWhere(db.raw(`starts_after + created_to_started_timeout_secs * INTERVAL '1 seconds' < CURRENT_TIMESTAMP`));
                builder
                    .orWhere({ state: 'STARTED' })
                    .andWhere(db.raw(`last_heartbeat_at + heartbeat_timeout_secs * INTERVAL '1 seconds' < CURRENT_TIMESTAMP`));
                builder
                    .orWhere({ state: 'STARTED' })
                    .andWhere(db.raw(`last_state_transition_at + started_to_completed_timeout_secs * INTERVAL '1 seconds' < CURRENT_TIMESTAMP`));
            })
                .forUpdate()
                .skipLocked())
                .returning('*');
            if (!(tasks === null || tasks === void 0 ? void 0 : tasks[0])) {
                return Ok([]);
            }
            return Ok(tasks.map(DbTask.from));
        }
        catch (err) {
            return Err(new Error(`Error expiring tasks: ${stringifyError(err)}`));
        }
    });
}
//# sourceMappingURL=tasks.js.map