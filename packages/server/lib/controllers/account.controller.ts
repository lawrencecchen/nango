import type { Request, Response, NextFunction } from 'express';
import type { LogLevel } from '@nangohq/shared';
import { isCloud } from '@nangohq/utils';
import { accountService, userService, LogActionEnum, createActivityLogAndLogMessage } from '@nangohq/shared';
import type { LogContext } from '@nangohq/logs';
import { logContextGetter } from '@nangohq/logs';
import type { RequestLocals } from '../utils/express.js.js';

export const NANGO_ADMIN_UUID = process.env['NANGO_ADMIN_UUID'];
export const AUTH_ADMIN_SWITCH_ENABLED = NANGO_ADMIN_UUID && isCloud;
export const AUTH_ADMIN_SWITCH_MS = 600 * 1000;

class AccountController {
    async getAccount(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction) {
        try {
            const { account, user } = res.locals;

            if (account.uuid === NANGO_ADMIN_UUID) {
                account.is_admin = true;
            }

            const { uuid, ...accountData } = account;

            const users = await userService.getUsersByAccountId(account.id);
            const invitedUsers = await userService.getInvitedUsersByAccountId(account.id);

            const usersWithCurrentUser = users.map((invitedUser) => {
                if (invitedUser.email === user.email) {
                    invitedUser.currentUser = true;
                }
                return invitedUser;
            });

            res.status(200).send({ account: accountData, users: usersWithCurrentUser, invitedUsers });
        } catch (err) {
            next(err);
        }
    }

    async editAccount(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction) {
        try {
            const { account } = res.locals;

            const name = req.body['name'];

            if (!name) {
                res.status(400).send({ error: 'Account name cannot be empty.' });
                return;
            }

            await accountService.editAccount(name, account.id);
            res.status(200).send({ name });
        } catch (err) {
            next(err);
        }
    }

    async editCustomer(req: Request, res: Response<any, never>, next: NextFunction) {
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

            const account = await accountService.getAccountByUUID(accountUUID);

            if (!account) {
                res.status(400).send({ error: 'Account not found' });
                return;
            }

            await accountService.editCustomer(is_capped, account.id);
            res.status(200).send({ is_capped, accountUUID });
        } catch (err) {
            next(err);
        }
    }

    async switchAccount(
        req: Request<unknown, unknown, { account_uuid?: string; login_reason?: string }>,
        res: Response<any, Required<RequestLocals>>,
        next: NextFunction
    ) {
        if (!AUTH_ADMIN_SWITCH_ENABLED) {
            res.status(400).send('Account switching only allowed in cloud');

            return;
        }

        let logCtx: LogContext | undefined;
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

            const result = await accountService.getAccountAndEnvironmentIdByUUID(account_uuid, environment.name);

            if (!result) {
                res.status(400).send({ message: 'Invalid account_uuid' });
                return;
            }

            const user = await userService.getAnUserByAccountId(result.accountId);

            if (!user) {
                res.status(400).send({ message: 'Cannot switch to account with no users' });
                return;
            }

            const log = {
                level: 'info' as LogLevel,
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

            const activityLogId = await createActivityLogAndLogMessage(log, {
                level: 'info',
                environment_id: environment.id,
                timestamp: Date.now(),
                content: `A Nango admin logged into another account for the following reason: "${login_reason}"`
            });
            logCtx = await logContextGetter.create(
                { id: String(activityLogId), operation: { type: 'admin', action: 'impersonation' }, message: 'Admin logged into another account' },
                {
                    account,
                    environment,
                    meta: { loginReason: login_reason, admin: adminUser.email, impersonating: user.id }
                }
            );
            await logCtx.info('A Nango admin logged into another account');

            req.login(user, (err) => {
                if (err) {
                    next(err);
                    void logCtx!.failed();
                    return;
                }

                // Modify default session to expires sooner than regular session
                req.session.cookie.expires = new Date(Date.now() + AUTH_ADMIN_SWITCH_MS);
                req.session.debugMode = true;

                req.session.save((err) => {
                    if (err) {
                        next(err);
                        void logCtx!.failed();
                        return;
                    }

                    void logCtx!.success();
                    res.status(200).send({ success: true });
                });
            });
        } catch (err) {
            if (logCtx) {
                await logCtx.error('uncaught error', { error: err });
                await logCtx.failed();
            }
            next(err);
        }
    }
}

export default new AccountController();
