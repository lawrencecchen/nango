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
import { isCloud } from '@nangohq/utils';
import { accountService, userService, LogActionEnum, createActivityLogAndLogMessage } from '@nangohq/shared';
import { logContextGetter } from '@nangohq/logs';
export const NANGO_ADMIN_UUID = process.env['NANGO_ADMIN_UUID'];
export const AUTH_ADMIN_SWITCH_ENABLED = NANGO_ADMIN_UUID && isCloud;
export const AUTH_ADMIN_SWITCH_MS = 600 * 1000;
class AccountController {
    getAccount(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { account, user } = res.locals;
                if (account.uuid === NANGO_ADMIN_UUID) {
                    account.is_admin = true;
                }
                const { uuid } = account, accountData = __rest(account, ["uuid"]);
                const users = yield userService.getUsersByAccountId(account.id);
                const invitedUsers = yield userService.getInvitedUsersByAccountId(account.id);
                const usersWithCurrentUser = users.map((invitedUser) => {
                    if (invitedUser.email === user.email) {
                        invitedUser.currentUser = true;
                    }
                    return invitedUser;
                });
                res.status(200).send({ account: accountData, users: usersWithCurrentUser, invitedUsers });
            }
            catch (err) {
                next(err);
            }
        });
    }
    editAccount(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { account } = res.locals;
                const name = req.body['name'];
                if (!name) {
                    res.status(400).send({ error: 'Account name cannot be empty.' });
                    return;
                }
                yield accountService.editAccount(name, account.id);
                res.status(200).send({ name });
            }
            catch (err) {
                next(err);
            }
        });
    }
    editCustomer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { is_capped, account_uuid: accountUUID } = req.body;
                if (!accountUUID) {
                    res.status(400).send({ error: 'account_uuid property is required' });
                    return;
                }
                if (is_capped === undefined || is_capped === null) {
                    res.status(400).send({ error: 'is_capped property is required' });
                    return;
                }
                const account = yield accountService.getAccountByUUID(accountUUID);
                if (!account) {
                    res.status(400).send({ error: 'Account not found' });
                    return;
                }
                yield accountService.editCustomer(is_capped, account.id);
                res.status(200).send({ is_capped, accountUUID });
            }
            catch (err) {
                next(err);
            }
        });
    }
    switchAccount(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!AUTH_ADMIN_SWITCH_ENABLED) {
                res.status(400).send('Account switching only allowed in cloud');
                return;
            }
            let logCtx;
            try {
                const { account, environment, user: adminUser } = res.locals;
                if (account.uuid !== NANGO_ADMIN_UUID) {
                    res.status(401).send({ message: 'Unauthorized' });
                    return;
                }
                if (!req.body) {
                    res.status(400).send({ message: 'Missing request body' });
                    return;
                }
                const { account_uuid, login_reason } = req.body;
                if (!account_uuid) {
                    res.status(400).send({ message: 'Missing account_uuid' });
                    return;
                }
                if (!login_reason) {
                    res.status(400).send({ message: 'Missing login_reason' });
                    return;
                }
                const result = yield accountService.getAccountAndEnvironmentIdByUUID(account_uuid, environment.name);
                if (!result) {
                    res.status(400).send({ message: 'Invalid account_uuid' });
                    return;
                }
                const user = yield userService.getAnUserByAccountId(result.accountId);
                if (!user) {
                    res.status(400).send({ message: 'Cannot switch to account with no users' });
                    return;
                }
                const log = {
                    level: 'info',
                    success: true,
                    action: LogActionEnum.ACCOUNT,
                    start: Date.now(),
                    end: Date.now(),
                    timestamp: Date.now(),
                    connection_id: 'n/a',
                    provider: null,
                    provider_config_key: '',
                    environment_id: environment.id
                };
                const activityLogId = yield createActivityLogAndLogMessage(log, {
                    level: 'info',
                    environment_id: environment.id,
                    timestamp: Date.now(),
                    content: `A Nango admin logged into another account for the following reason: "${login_reason}"`
                });
                logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'admin', action: 'impersonation' }, message: 'Admin logged into another account' }, {
                    account,
                    environment,
                    meta: { loginReason: login_reason, admin: adminUser.email, impersonating: user.id }
                });
                yield logCtx.info('A Nango admin logged into another account');
                req.login(user, (err) => {
                    if (err) {
                        next(err);
                        void logCtx.failed();
                        return;
                    }
                    // Modify default session to expires sooner than regular session
                    req.session.cookie.expires = new Date(Date.now() + AUTH_ADMIN_SWITCH_MS);
                    req.session.debugMode = true;
                    req.session.save((err) => {
                        if (err) {
                            next(err);
                            void logCtx.failed();
                            return;
                        }
                        void logCtx.success();
                        res.status(200).send({ success: true });
                    });
                });
            }
            catch (err) {
                if (logCtx) {
                    yield logCtx.error('uncaught error', { error: err });
                    yield logCtx.failed();
                }
                next(err);
            }
        });
    }
}
export default new AccountController();
//# sourceMappingURL=account.controller.js.map