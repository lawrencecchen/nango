var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isCloud, isEnterprise, basePublicUrl } from '@nangohq/utils';
import { errorManager, userService } from '@nangohq/shared';
import EmailClient from '../clients/email.client.js';
import { getUserFromSession } from '../utils/utils.js';
class UserController {
    getUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const getUser = yield getUserFromSession(req);
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
            }
            catch (err) {
                next(err);
            }
        });
    }
    editName(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const getUser = yield getUserFromSession(req);
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
                yield userService.editUserName(name, user.id);
                res.status(200).send({ name });
            }
            catch (err) {
                next(err);
            }
        });
    }
    editPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const getUser = yield getUserFromSession(req);
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
                yield userService.changePassword(oldPassword, newPassword, user.id);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    invite(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { account, user } = res.locals;
                const email = req.body['email'];
                const name = req.body['name'];
                if (!email || !name) {
                    res.status(400).send({ error: 'Email and name cannot be empty.' });
                    return;
                }
                const existingUser = yield userService.getUserByEmail(email);
                if (existingUser) {
                    res.status(400).send({ error: 'User with this email already exists.' });
                    return;
                }
                const invited = yield userService.inviteUser(email, name, account.id, user.id);
                if (!invited) {
                    throw new Error('Failed to invite user.');
                }
                if (isCloud || isEnterprise) {
                    const emailClient = EmailClient.getInstance();
                    emailClient.send(invited.email, `Join the "${account.name}" account on Nango`, `
<p>Hi,</p>

<p>You are invited to join the ${account.name} account on Nango.</p>

<p>Join this account by clicking <a href="${basePublicUrl}/signup/${invited.token}">here</a> and completing your signup.</p>

<p>Questions or issues? We are happy to help on the <a href="https://nango.dev/slack">Slack community</a>!</p>

<p>Best,<br>
Team Nango</p>
            `);
                }
                res.status(200).send(invited);
            }
            catch (err) {
                next(err);
            }
        });
    }
    suspend(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.params['userId'];
                yield userService.suspendUser(Number(userId));
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
}
export default new UserController();
//# sourceMappingURL=user.controller.js.map