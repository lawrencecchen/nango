var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { uuidv7 } from 'uuidv7';
import { Err, Ok, stringifyError } from '@nangohq/utils';
export const SCHEDULES_TABLE = 'schedules';
export const validScheduleStateTransitions = [
    { from: 'STARTED', to: 'PAUSED' },
    { from: 'STARTED', to: 'DELETED' },
    { from: 'PAUSED', to: 'STARTED' },
    { from: 'PAUSED', to: 'DELETED' }
];
const ScheduleStateTransition = {
    validate({ from, to }) {
        const transition = validScheduleStateTransitions.find((t) => t.from === from && t.to === to);
        if (transition) {
            return Ok(transition);
        }
        else {
            return Err(new Error(`Invalid state transition from ${from} to ${to}`));
        }
    }
};
// knex uses https://github.com/bendrucker/postgres-interval
function postgresIntervalInMs(i) {
    var _a, _b, _c, _d, _e, _f, _g;
    return (((_a = i.years) !== null && _a !== void 0 ? _a : 0) * 31536000000 +
        ((_b = i.months) !== null && _b !== void 0 ? _b : 0) * 2592000000 +
        ((_c = i.days) !== null && _c !== void 0 ? _c : 0) * 86400000 +
        ((_d = i.hours) !== null && _d !== void 0 ? _d : 0) * 3600000 +
        ((_e = i.minutes) !== null && _e !== void 0 ? _e : 0) * 60000 +
        ((_f = i.seconds) !== null && _f !== void 0 ? _f : 0) * 1000 +
        ((_g = i.milliseconds) !== null && _g !== void 0 ? _g : 0));
}
export const DbSchedule = {
    to: (schedule) => ({
        id: schedule.id.toString(),
        name: schedule.name,
        state: schedule.state,
        starts_at: schedule.startsAt,
        frequency: `${schedule.frequencyMs} milliseconds`,
        payload: schedule.payload,
        group_key: schedule.groupKey,
        retry_max: schedule.retryMax,
        created_to_started_timeout_secs: schedule.createdToStartedTimeoutSecs,
        started_to_completed_timeout_secs: schedule.startedToCompletedTimeoutSecs,
        heartbeat_timeout_secs: schedule.heartbeatTimeoutSecs,
        created_at: schedule.createdAt,
        updated_at: schedule.updatedAt,
        deleted_at: schedule.deletedAt
    }),
    from: (dbSchedule) => ({
        id: dbSchedule.id,
        name: dbSchedule.name,
        state: dbSchedule.state,
        startsAt: dbSchedule.starts_at,
        frequencyMs: postgresIntervalInMs(dbSchedule.frequency),
        payload: dbSchedule.payload,
        groupKey: dbSchedule.group_key,
        retryMax: dbSchedule.retry_max,
        createdToStartedTimeoutSecs: dbSchedule.created_to_started_timeout_secs,
        startedToCompletedTimeoutSecs: dbSchedule.started_to_completed_timeout_secs,
        heartbeatTimeoutSecs: dbSchedule.heartbeat_timeout_secs,
        createdAt: dbSchedule.created_at,
        updatedAt: dbSchedule.updated_at,
        deletedAt: dbSchedule.deleted_at
    })
};
export function create(db, props) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const newSchedule = Object.assign(Object.assign({}, props), { id: uuidv7(), payload: props.payload, startsAt: now, frequencyMs: props.frequencyMs, createdAt: now, updatedAt: now, deletedAt: null });
        try {
            const inserted = yield db.from(SCHEDULES_TABLE).insert(DbSchedule.to(newSchedule)).returning('*');
            if (!(inserted === null || inserted === void 0 ? void 0 : inserted[0])) {
                return Err(new Error(`Error: no schedule '${props.name}' created`));
            }
            return Ok(DbSchedule.from(inserted[0]));
        }
        catch (err) {
            return Err(new Error(`Error creating schedule '${props.name}': ${stringifyError(err)}`));
        }
    });
}
export function get(db, scheduleId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schedule = yield db.from(SCHEDULES_TABLE).where('id', scheduleId).first();
            if (!schedule) {
                return Err(new Error(`Error: no schedule '${scheduleId}' found`));
            }
            return Ok(DbSchedule.from(schedule));
        }
        catch (err) {
            return Err(new Error(`Error getting schedule '${scheduleId}': ${stringifyError(err)}`));
        }
    });
}
export function transitionState(db, scheduleId, to) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const getSchedule = yield get(db, scheduleId);
            if (getSchedule.isErr()) {
                return Err(new Error(`Error: no schedule '${scheduleId}' found`));
            }
            const transition = ScheduleStateTransition.validate({ from: getSchedule.value.state, to });
            if (transition.isErr()) {
                return Err(transition.error);
            }
            const now = new Date();
            const values = Object.assign({ state: to, updated_at: now }, (to === 'DELETED' ? { deleted_at: now } : {}));
            const updated = yield db.from(SCHEDULES_TABLE).where('id', scheduleId).update(values).returning('*');
            if (!(updated === null || updated === void 0 ? void 0 : updated[0])) {
                return Err(new Error(`Error: no schedule '${scheduleId}' updated`));
            }
            return Ok(DbSchedule.from(updated[0]));
        }
        catch (err) {
            return Err(new Error(`Error transitioning schedule '${scheduleId}': ${stringifyError(err)}`));
        }
    });
}
export function update(db, props) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const newValues = Object.assign(Object.assign(Object.assign({}, (props.frequencyMs ? { frequency: `${props.frequencyMs} milliseconds` } : {})), (props.payload ? { payload: props.payload } : {})), { updated_at: new Date() });
            const updated = yield db.from(SCHEDULES_TABLE).where('id', props.id).update(newValues).returning('*');
            if (!(updated === null || updated === void 0 ? void 0 : updated[0])) {
                return Err(new Error(`Error: no schedule '${props.id}' updated`));
            }
            return Ok(DbSchedule.from(updated[0]));
        }
        catch (err) {
            return Err(new Error(`Error updating schedule '${props.id}': ${stringifyError(err)}`));
        }
    });
}
export function remove(db, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const now = new Date();
            const deleted = yield db
                .from(SCHEDULES_TABLE)
                .where('id', id)
                .update({ state: 'DELETED', deleted_at: now, updated_at: now })
                .returning('*');
            if (!(deleted === null || deleted === void 0 ? void 0 : deleted[0])) {
                return Err(new Error(`Error: no schedule '${id}' deleted`));
            }
            return Ok(DbSchedule.from(deleted[0]));
        }
        catch (err) {
            return Err(new Error(`Error deleting schedule '${id}': ${stringifyError(err)}`));
        }
    });
}
export function search(db, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = db.from(SCHEDULES_TABLE).limit(params.limit);
            if (params.id) {
                query.where('id', params.id);
            }
            if (params.names) {
                query.whereIn('name', params.names);
            }
            if (params.state) {
                query.where('state', params.state);
            }
            if (params.forUpdate) {
                query.forUpdate();
            }
            const schedules = yield query;
            return Ok(schedules.map(DbSchedule.from));
        }
        catch (err) {
            return Err(new Error(`Error searching schedules: ${stringifyError(err)}`));
        }
    });
}
//# sourceMappingURL=schedules.js.map