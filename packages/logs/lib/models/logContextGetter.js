var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { nanoid, stringifyError } from '@nangohq/utils';
import { createMessage, getOperation } from './messages.js';
import { envs } from '../env.js';
import { getFormattedMessage } from './helpers.js';
import { LogContext, LogContextStateless } from '../client.js';
import { getKVStore, logger } from '../utils.js';
export const logContextGetter = {
    /**
     * Create an operation and return a Context
     */
    create(data, _a, options) {
        var _b;
        var { start } = _a, rest = __rest(_a, ["start"]);
        return __awaiter(this, void 0, void 0, function* () {
            const msg = getFormattedMessage(data, rest);
            if (typeof start === 'undefined' || start) {
                msg.startedAt = (_b = msg.startedAt) !== null && _b !== void 0 ? _b : new Date().toISOString();
                msg.state = msg.state === 'waiting' ? 'running' : msg.state;
            }
            try {
                if (envs.NANGO_LOGS_ENABLED && !(options === null || options === void 0 ? void 0 : options.dryRun)) {
                    const res = yield createMessage(msg);
                    const store = yield getKVStore();
                    yield store.set(`es:operation:${msg.id}:indexName`, res.index, { ttlInMs: 60 * 1000 });
                }
                else if ((options === null || options === void 0 ? void 0 : options.logToConsole) !== false) {
                    logger.info(`[debug] operation(${JSON.stringify(msg)})`);
                }
            }
            catch (err) {
                // TODO: reup throw
                logger.error(`failed_to_create_operation ${stringifyError(err)}`);
            }
            return new LogContext({ parentId: msg.id, operation: msg }, options);
        });
    },
    /**
     * Return a Context without creating an operation
     */
    get({ id }, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (envs.NANGO_LOGS_ENABLED) {
                    const store = yield getKVStore();
                    const indexName = yield store.get(`es:operation:${id}:indexName`);
                    const operation = yield getOperation({ id, indexName });
                    return new LogContext({ parentId: id, operation }, options);
                }
            }
            catch (err) {
                // TODO: reup throw
                logger.error(`failed_to_get_operation ${stringifyError(err)}`);
            }
            // If it failed, we create a fake operation for now
            return new LogContext({ parentId: id, operation: { id: nanoid(), createdAt: new Date().toISOString() } }, Object.assign(Object.assign({}, options), { dryRun: true }));
        });
    },
    getStateLess({ id }, options) {
        return new LogContextStateless({ parentId: id }, options);
    }
};
//# sourceMappingURL=logContextGetter.js.map