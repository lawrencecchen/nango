var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as uuid from 'uuid';
import sentry from '@sentry/node';
import { getLogger, isCloud, stringifyError } from '@nangohq/utils';
import { NangoError } from './error.js';
import environmentService from '../services/environment.service.js';
import accountService from '../services/account.service.js';
import userService from '../services/user.service.js';
import { NANGO_VERSION } from '../version.js';
const logger = getLogger('ErrorManager');
export var ErrorSourceEnum;
(function (ErrorSourceEnum) {
    ErrorSourceEnum["PLATFORM"] = "platform";
    ErrorSourceEnum["CUSTOMER"] = "customer";
})(ErrorSourceEnum = ErrorSourceEnum || (ErrorSourceEnum = {}));
class ErrorManager {
    constructor() {
        try {
            if (isCloud && process.env['SENTRY_DNS']) {
                const packageVersion = NANGO_VERSION;
                sentry.init({
                    dsn: process.env['SENTRY_DNS'],
                    beforeSend(event, _) {
                        var _a;
                        return ((_a = event.user) === null || _a === void 0 ? void 0 : _a.id) === 'account-78' ? null : event;
                    },
                    environment: process.env['NODE_ENV'],
                    release: 'nango@' + packageVersion
                });
            }
        }
        catch (_) {
            return;
        }
    }
    /**
     * TODO: reuse information in res.locals when possible
     */
    report(e, config = { source: ErrorSourceEnum.PLATFORM }, tracer) {
        void sentry.withScope(function (scope) {
            return __awaiter(this, void 0, void 0, function* () {
                if (config.environmentId || config.accountId) {
                    let accountId;
                    if (config.environmentId) {
                        const environmentName = yield environmentService.getEnvironmentName(config.environmentId);
                        accountId = (yield environmentService.getAccountIdFromEnvironment(config.environmentId));
                        sentry.setTag('environmentName', environmentName);
                    }
                    if (config.accountId && !config.environmentId) {
                        accountId = config.accountId;
                    }
                    const account = yield accountService.getAccountById(accountId);
                    if (!config.userId) {
                        const users = yield userService.getUsersByAccountId(accountId);
                        sentry.setUser({
                            id: `account-${accountId}`,
                            organization: (account === null || account === void 0 ? void 0 : account.name) || '',
                            emails: users.map((user) => user.email).join(','),
                            userIds: users.map((user) => user.id).join(',')
                        });
                    }
                }
                if (config.userId) {
                    const user = yield userService.getUserById(config.userId);
                    sentry.setUser({
                        id: `user-${config.userId}`,
                        email: (user === null || user === void 0 ? void 0 : user.email) || '',
                        userId: user === null || user === void 0 ? void 0 : user.id
                    });
                }
                sentry.setTag('source', config.source);
                if (config.operation) {
                    sentry.setTag('operation', config.operation);
                }
                if (config.metadata) {
                    const metadata = Object.entries(config.metadata).reduce((acc, [key, value]) => {
                        if (typeof value === 'object') {
                            acc[key] = JSON.stringify(value);
                        }
                        else {
                            acc[key] = value;
                        }
                        return acc;
                    }, {});
                    scope.setContext('metadata', metadata);
                }
                if (typeof e === 'string') {
                    sentry.captureException(new Error(e));
                }
                else {
                    sentry.captureException(e);
                }
            });
        });
        logger.error(`Exception caught: ${stringifyError(e, { stack: true })}`);
        if (e instanceof Error && tracer) {
            // Log to datadog manually
            // https://github.com/DataDog/dd-trace-js/issues/1944
            const span = tracer.scope().active();
            if (span) {
                span.setTag('error', e);
            }
        }
    }
    errResFromNangoErr(res, err) {
        if (err) {
            logger.error(`Response error: ${JSON.stringify({ statusCode: err.status, type: err.type, payload: err.payload, message: err.message })}`);
            if (!err.message) {
                res.status(err.status || 500).send({ error: { code: err.type || 'unknown_error', payload: err.payload } });
            }
            else {
                res.status(err.status || 500).send({ error: { message: err.message, code: err.type, payload: err.payload } });
            }
        }
        else {
            res.status(500).json({ error: { code: 'unknown_empty_error' } });
        }
    }
    errRes(res, type) {
        const err = new NangoError(type);
        this.errResFromNangoErr(res, err);
    }
    handleGenericError(err, _, res, tracer) {
        const errorId = uuid.v4();
        let nangoErr;
        if (!(err instanceof Error)) {
            nangoErr = new NangoError('generic_error_malformed', errorId);
        }
        else if (!(err instanceof NangoError)) {
            nangoErr = new NangoError(err.message, errorId);
        }
        else {
            nangoErr = err;
        }
        let environmentId;
        if ('environment' in res.locals) {
            environmentId = res.locals['environment'].id;
        }
        this.report(err, { source: ErrorSourceEnum.PLATFORM, environmentId, metadata: nangoErr.payload }, tracer);
        const supportError = new NangoError('generic_error_support', errorId);
        this.errResFromNangoErr(res, supportError);
    }
    getExpressRequestContext(req) {
        const metadata = {};
        metadata['baseUrl'] = req.baseUrl;
        metadata['originalUrl'] = req.originalUrl;
        metadata['subdomains'] = req.subdomains;
        metadata['body'] = req.body;
        metadata['hostname'] = req.hostname;
        metadata['method'] = req.method;
        metadata['params'] = req.params;
        metadata['query'] = req.query;
        return metadata;
    }
}
export default new ErrorManager();
//# sourceMappingURL=error.manager.js.map