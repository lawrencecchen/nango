var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isCloud, isBasicAuthEnabled, getLogger, metrics, stringifyError } from '@nangohq/utils';
import { LogActionEnum, ErrorSourceEnum, environmentService, errorManager, userService } from '@nangohq/shared';
import tracer from 'dd-trace';
import { NANGO_ADMIN_UUID } from '../controllers/account.controller.js';
const logger = getLogger('AccessMiddleware');
const keyRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
const ignoreEnvPaths = ['/api/v1/meta', '/api/v1/user', '/api/v1/user/name', '/api/v1/users/:userId/suspend', '/api/v1/signin'];
export class AccessMiddleware {
    secretKeyAuth(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const active = tracer.scope().active();
            const span = tracer.startSpan('secretKeyAuth', {
                childOf: active
            });
            const start = Date.now();
            try {
                const authorizationHeader = req.get('authorization');
                if (!authorizationHeader) {
                    return errorManager.errRes(res, 'missing_auth_header');
                }
                const secret = authorizationHeader.split('Bearer ').pop();
                if (!secret) {
                    return errorManager.errRes(res, 'malformed_auth_header');
                }
                if (!keyRegex.test(secret)) {
                    return errorManager.errRes(res, 'invalid_secret_key_format');
                }
                const result = yield environmentService.getAccountAndEnvironmentBySecretKey(secret);
                if (!result) {
                    res.status(401).send({ error: { code: 'unknown_user_account' } });
                    return;
                }
                res.locals['authType'] = 'secretKey';
                res.locals['account'] = result.account;
                res.locals['environment'] = result.environment;
                tracer.setUser({ id: String(result.account.id), environmentId: String(result.environment.id) });
                next();
            }
            catch (err) {
                logger.error(`failed_get_env_by_secret_key ${stringifyError(err)}`);
                return errorManager.errRes(res, 'malformed_auth_header');
            }
            finally {
                metrics.duration(metrics.Types.AUTH_GET_ENV_BY_SECRET_KEY, Date.now() - start);
                span.finish();
            }
        });
    }
    /**
     * Inherit secretKeyAuth
     */
    adminKeyAuth(_, res, next) {
        var _a;
        if (((_a = res.locals['account']) === null || _a === void 0 ? void 0 : _a.uuid) !== NANGO_ADMIN_UUID) {
            res.status(401).send({ error: { code: 'unauthorized' } });
            return;
        }
        res.locals['authType'] = 'adminKey';
        next();
    }
    publicKeyAuth(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const active = tracer.scope().active();
            const span = tracer.startSpan('publicKeyAuth', {
                childOf: active
            });
            const start = Date.now();
            try {
                const publicKey = req.query['public_key'];
                if (!publicKey) {
                    return errorManager.errRes(res, 'missing_public_key');
                }
                if (!keyRegex.test(publicKey)) {
                    return errorManager.errRes(res, 'invalid_public_key');
                }
                const result = yield environmentService.getAccountAndEnvironmentByPublicKey(publicKey);
                if (!result) {
                    res.status(401).send({ error: { code: 'unknown_user_account' } });
                    return;
                }
                res.locals['authType'] = 'publicKey';
                res.locals['account'] = result.account;
                res.locals['environment'] = result.environment;
                tracer.setUser({ id: String(result.account.id), environmentId: String(result.environment.id) });
                next();
            }
            catch (e) {
                errorManager.report(e, { source: ErrorSourceEnum.PLATFORM, operation: LogActionEnum.INTERNAL_AUTHORIZATION });
                return errorManager.errRes(res, 'unknown_account');
            }
            finally {
                metrics.duration(metrics.Types.AUTH_PUBLIC_KEY, Date.now() - start);
                span.finish();
            }
        });
    }
    sessionAuth(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const active = tracer.scope().active();
            const span = tracer.startSpan('sessionAuth', {
                childOf: active
            });
            const start = Date.now();
            try {
                if (!req.isAuthenticated()) {
                    res.status(401).send({ error: { code: 'unauthorized' } });
                    return;
                }
                if (ignoreEnvPaths.includes(req.route.path)) {
                    next();
                    return;
                }
                res.locals['authType'] = 'session';
                yield fillLocalsFromSession(req, res, next);
            }
            finally {
                metrics.duration(metrics.Types.AUTH_SESSION, Date.now() - start);
                span.finish();
            }
        });
    }
    noAuth(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.isAuthenticated()) {
                const user = yield userService.getUserById(process.env['LOCAL_NANGO_USER_ID'] ? parseInt(process.env['LOCAL_NANGO_USER_ID']) : 0);
                req.login(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    next();
                });
                return;
            }
            res.locals['authType'] = 'none';
            yield fillLocalsFromSession(req, res, next);
        });
    }
    basicAuth(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Already signed in.
            if (req.isAuthenticated()) {
                yield fillLocalsFromSession(req, res, next);
                res.locals['authType'] = 'basic';
                return;
            }
            // Protected by basic auth: should be signed in.
            if (isBasicAuthEnabled) {
                res.status(401).send({ error: { code: 'unauthorized' } });
                return;
            }
        });
    }
    admin(req, res, next) {
        if (!isCloud) {
            return errorManager.errRes(res, 'only_nango_cloud');
        }
        const adminKey = process.env['NANGO_ADMIN_KEY'];
        if (!adminKey) {
            return errorManager.errRes(res, 'admin_key_configuration');
        }
        const authorizationHeader = req.get('authorization');
        if (!authorizationHeader) {
            return errorManager.errRes(res, 'missing_auth_header');
        }
        const candidateKey = authorizationHeader.split('Bearer ').pop();
        if (candidateKey !== adminKey) {
            return errorManager.errRes(res, 'invalid_admin_key');
        }
        next();
    }
}
/**
 * Fill res.locals with common information
 */
function fillLocalsFromSession(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ignoreEnvPaths.includes(req.route.path)) {
            next();
            return;
        }
        try {
            const user = yield userService.getUserById(req.user.id);
            if (!user) {
                res.status(401).send({ error: { code: 'unknown_user' } });
                return;
            }
            const currentEnv = req.query['env'];
            if (typeof currentEnv !== 'string') {
                res.status(401).send({ error: { code: 'invalid_env' } });
                return;
            }
            const result = yield environmentService.getAccountAndEnvironment({ accountId: user.account_id, envName: currentEnv });
            if (!result) {
                res.status(401).send({ error: { code: 'unknown_account_or_env' } });
                return;
            }
            res.locals['user'] = req.user;
            res.locals['account'] = result.account;
            res.locals['environment'] = result.environment;
            next();
        }
        catch (_a) {
            res.status(401).send({ error: { code: 'unknown_key' } });
            return;
        }
    });
}
export default new AccessMiddleware();
//# sourceMappingURL=access.middleware.js.map