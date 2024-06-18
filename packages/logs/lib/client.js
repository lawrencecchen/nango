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
import { errorToObject, metrics, stringifyError } from '@nangohq/utils';
import { setRunning, createMessage, setFailed, setCancelled, setTimeouted, setSuccess, update } from './models/messages.js';
import { getFormattedMessage } from './models/helpers.js';
import { isCli, logger } from './utils.js';
import { envs } from './env.js';
/**
 * Context without operation (stateless)
 */
export class LogContextStateless {
    constructor(data, options = { dryRun: false, logToConsole: true }) {
        var _a;
        this.id = data.parentId;
        this.dryRun = isCli || !envs.NANGO_LOGS_ENABLED ? true : options.dryRun || false;
        this.logToConsole = (_a = options.logToConsole) !== null && _a !== void 0 ? _a : true;
    }
    log(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logToConsole) {
                const obj = {};
                if (data.error)
                    obj['error'] = data.error;
                if (data.meta)
                    obj['meta'] = data.meta;
                logger[data.level](`${this.dryRun ? '[dry] ' : ''}log: ${data.message}`, Object.keys(obj).length > 0 ? obj : undefined);
            }
            if (this.dryRun) {
                return true;
            }
            const start = Date.now();
            try {
                yield createMessage(getFormattedMessage(Object.assign(Object.assign({}, data), { parentId: this.id })));
                return true;
            }
            catch (err) {
                // TODO: reup throw
                logger.error(`failed_to_insert_in_es: ${stringifyError(err)}`);
                return false;
            }
            finally {
                metrics.duration(metrics.Types.LOGS_LOG, Date.now() - start);
            }
        });
    }
    debug(message, meta = null) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.log({ type: 'log', level: 'debug', message, meta, source: 'internal' });
        });
    }
    info(message, meta = null) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.log({ type: 'log', level: 'info', message, meta, source: 'internal' });
        });
    }
    warn(message, meta = null) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.log({ type: 'log', level: 'warn', message, meta, source: 'internal' });
        });
    }
    error(message, meta = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = meta || {}, { error } = _a, rest = __rest(_a, ["error"]);
            const err = error ? Object.assign({ name: 'Unknown Error', message: 'unknown error' }, errorToObject(error)) : null;
            return yield this.log({
                type: 'log',
                level: 'error',
                message,
                error: err ? { name: err.name, message: err.message } : null,
                meta: Object.keys(rest).length > 0 ? rest : null,
                source: 'internal'
            });
        });
    }
    /**
     * @deprecated Only there for retro compat
     */
    trace(message, meta = null) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.log({ type: 'log', level: 'debug', message, meta, source: 'internal' });
        });
    }
    http(message, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const level = data.response && data.response.code >= 400 ? 'error' : 'info';
            return yield this.log(Object.assign(Object.assign({ type: 'http', level, message }, data), { source: 'internal' }));
        });
    }
}
/**
 * Context with operation (can modify state)
 */
export class LogContext extends LogContextStateless {
    constructor(data, options = { dryRun: false, logToConsole: true }) {
        super(data, options);
        this.operation = data.operation;
    }
    /**
     * Add more data to the parentId
     */
    enrichOperation(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logOrExec(`enrich(${JSON.stringify(data)})`, () => __awaiter(this, void 0, void 0, function* () { return yield update({ id: this.id, data: Object.assign(Object.assign({}, data), { createdAt: this.operation.createdAt }) }); }));
        });
    }
    /**
     * ------ State
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logOrExec('start', () => __awaiter(this, void 0, void 0, function* () { return yield setRunning(this.operation); }));
        });
    }
    failed() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logOrExec('failed', () => __awaiter(this, void 0, void 0, function* () { return yield setFailed(this.operation); }));
        });
    }
    success() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logOrExec('success', () => __awaiter(this, void 0, void 0, function* () { return yield setSuccess(this.operation); }));
        });
    }
    cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logOrExec('cancel', () => __awaiter(this, void 0, void 0, function* () { return yield setCancelled(this.operation); }));
        });
    }
    timeout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logOrExec('timeout', () => __awaiter(this, void 0, void 0, function* () { return yield setTimeouted(this.operation); }));
        });
    }
    logOrExec(log, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logToConsole) {
                logger.info(`${this.dryRun ? '[dry] ' : ''}${log}(${this.id})`);
            }
            if (this.dryRun) {
                return;
            }
            try {
                yield callback();
            }
            catch (err) {
                // TODO: reup throw
                logger.error(`failed_to_set_${log} ${stringifyError(err)}`);
            }
        });
    }
}
//# sourceMappingURL=client.js.map