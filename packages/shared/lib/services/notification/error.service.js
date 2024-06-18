var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Ok, Err } from '@nangohq/utils';
import db from '@nangohq/database';
const DB_TABLE = '_nango_active_logs';
export const errorNotificationService = {
    auth: {
        create: ({ type, action, connection_id, activity_log_id, log_id, active }) => __awaiter(void 0, void 0, void 0, function* () {
            return yield db.knex.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
                yield errorNotificationService.auth.clear({ connection_id, trx });
                const created = yield trx
                    .from(DB_TABLE)
                    .insert({
                    type,
                    action,
                    connection_id,
                    activity_log_id,
                    log_id,
                    active
                })
                    .returning('*');
                if (created === null || created === void 0 ? void 0 : created[0]) {
                    return Ok(created[0]);
                }
                else {
                    return Err('Failed to create notification');
                }
            }));
        }),
        get: (id) => __awaiter(void 0, void 0, void 0, function* () {
            return yield db.knex.from(DB_TABLE).where({ type: 'auth', connection_id: id, active: true }).first();
        }),
        clear: ({ connection_id, trx = db.knex }) => __awaiter(void 0, void 0, void 0, function* () {
            yield trx.from(DB_TABLE).where({ type: 'auth', connection_id }).delete();
        })
    },
    sync: {
        create: ({ type, action, sync_id, connection_id, activity_log_id, log_id, active }) => __awaiter(void 0, void 0, void 0, function* () {
            return yield db.knex.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
                yield errorNotificationService.sync.clear({ sync_id, connection_id, trx });
                const created = yield trx
                    .from(DB_TABLE)
                    .insert({
                    type,
                    action,
                    sync_id,
                    connection_id,
                    activity_log_id,
                    log_id,
                    active
                })
                    .returning('*');
                if (created === null || created === void 0 ? void 0 : created[0]) {
                    return Ok(created[0]);
                }
                else {
                    return Err('Failed to create notification');
                }
            }));
        }),
        clear: ({ sync_id, connection_id, trx = db.knex }) => __awaiter(void 0, void 0, void 0, function* () {
            yield trx.from(DB_TABLE).where({ type: 'sync', sync_id, connection_id }).delete();
        }),
        clearBySyncId: ({ sync_id }) => __awaiter(void 0, void 0, void 0, function* () {
            yield db.knex.from(DB_TABLE).where({ type: 'sync', sync_id }).delete();
        })
    }
};
//# sourceMappingURL=error.service.js.map