import type { Request, Response, NextFunction } from 'express';
import { isCloud, isEnterprise, basePublicUrl } from '@nangohq/utils';
import { errorManager, userService } from '@nangohq/shared';

import EmailClient from '../clients/email.client.js';
import { getUserFromSession } from '../utils/utils.js';
import type { RequestLocals } from '../utils/express.js';

export interface GetUser {
    user: {
        id: number;
        accountId: number;
        email: string;
        name: string;
    };
}

class UserController {
    async getUser(req: Request, res: Response<GetUser, never>, next: NextFunction) {
        try {
            const getUser = await getUserFromSession(req);
            if (getUser.isErr()) {
                errorManager.errResFromNangoErr(res, getUser.error);
                return;
            }

            const user = getUser.value;
            res.status(200).send({
                user: {
                    id: user.id,
                    accountId: user.account_id,
                    email: user.email,
                    name: user.name
                }
            });
        } catch (err) {
            next(err);
        }
    }

    async editName(req: Request, res: Response<any, never>, next: NextFunction) {
        try {
            const getUser = await getUserFromSession(req);
            if (getUser.isErr()) {
                errorManager.errResFromNangoErr(res, getUser.error);
                return;
            }

            const user = getUser.value;
            const name = req.body['name'];

            if (!name) {
                res.status(400).send({ error: 'User name cannot be empty.' });
                return;
            }

            await userService.editUserName(name, user.id);
            res.status(200).send({ name });
        } catch (err) {
            next(err);
        }
    }

    async editPassword(req: Request, res: Response<any, never>, next: NextFunction) {
        try {
            const getUser = await getUserFromSession(req);
            if (getUser.isErr()) {
                errorManager.errResFromNangoErr(res, getUser.error);
                return;
            }

            const user = getUser.value;
            const oldPassword = req.body['old_password'];
            const newPassword = req.body['new_password'];

            if (!oldPassword || !newPassword) {
                res.status(400).send({ error: 'Old password and new password cannot be empty.' });
                return;
            }

            await userService.changePassword(oldPassword, newPassword, user.id);
            res.status(200).send();
        } catch (err) {
            next(err);
        }
    }

    async invite(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction) {
        try {
            const { account, user } = res.locals;

            const email = req.body['email'];
            const name = req.body['name'];

            if (!email || !name) {
                res.status(400).send({ error: 'Email and name cannot be empty.' });
                return;
            }

            const existingUser = await userService.getUserByEmail(email);

            if (existingUser) {
                res.status(400).send({ error: 'User with this email already exists.' });
                return;
            }

            const invited = await userService.inviteUser(email, name, account.id, user.id);
            if (!invited) {
                throw new Error('Failed to invite user.');
            }
            if (isCloud || isEnterprise) {
                const emailClient = EmailClient.getInstance();
                emailClient.send(
                    invited.email,
                    `Join the "${account.name}" account on Nango`,
                    `
<p>Hi,</p>

<p>You are invited to join the ${account.name} account on Nango.</p>

<p>Join this account by clicking <a href="${basePublicUrl}/signup/${invited.token}">here</a> and completing your signup.</p>

<p>Questions or issues? We are happy to help on the <a href="https://nango.dev/slack">Slack community</a>!</p>

<p>Best,<br>
Team Nango</p>
            `
                );
            }
            res.status(200).send(invited);
        } catch (err) {
            next(err);
        }
    }

    async suspend(req: Request, res: Response<any, never>, next: NextFunction) {
        try {
            const userId = req.params['userId'];

            await userService.suspendUser(Number(userId));
            res.status(200).send();
        } catch (err) {
            next(err);
        }
    }
}

export default new UserController();
