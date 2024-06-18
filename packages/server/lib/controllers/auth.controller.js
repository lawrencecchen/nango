var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import crypto from 'crypto';
import util from 'util';
import jwt from 'jsonwebtoken';
import { baseUrl, basePublicUrl, getLogger, Err, Ok } from '@nangohq/utils';
import { userService, accountService, errorManager, ErrorSourceEnum, NangoError } from '@nangohq/shared';
import { getWorkOSClient } from '../clients/workos.client.js';
import EmailClient from '../clients/email.client.js';
import { resetPasswordSecret } from '../utils/utils.js';
const logger = getLogger('Server.AuthController');
const allowedProviders = ['GoogleOAuth'];
const parseState = (state) => {
    try {
        const parsed = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
        return Ok(parsed);
    }
    catch (_a) {
        const error = new Error('Invalid state');
        return Err(error);
    }
};
const createAccountIfNotInvited = (name, state) => __awaiter(void 0, void 0, void 0, function* () {
    if (!state) {
        const account = yield accountService.createAccount(`${name}'s Organization`);
        if (!account) {
            throw new NangoError('account_creation_failure');
        }
        return account.id;
    }
    const parsedState = parseState(state);
    if (parsedState.isOk()) {
        const { accountId, token } = parsedState.value;
        const validToken = yield userService.getInvitedUserByToken(token);
        if (validToken) {
            yield userService.markAcceptedInvite(token);
        }
        return accountId;
    }
    return null;
});
class AuthController {
    logout(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                req.session.destroy((err) => {
                    if (err) {
                        next(err);
                    }
                    res.status(200).send();
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    forgotPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (email == null) {
                    errorManager.errRes(res, 'missing_email_param');
                    return;
                }
                const user = yield userService.getUserByEmail(email);
                if (user == null) {
                    errorManager.errRes(res, 'unknown_user');
                    return;
                }
                const resetToken = jwt.sign({ user: email }, resetPasswordSecret(), { expiresIn: '10m' });
                user.reset_password_token = resetToken;
                yield userService.editUserPassword(user);
                this.sendResetPasswordEmail(user, resetToken);
                res.status(200).json();
            }
            catch (error) {
                next(error);
            }
        });
    }
    resetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { password, token } = req.body;
                if (!token && !password) {
                    errorManager.errRes(res, 'missing_password_reset_token');
                    return;
                }
                if (token) {
                    jwt.verify(token, resetPasswordSecret(), (error, _) => __awaiter(this, void 0, void 0, function* () {
                        if (error) {
                            errorManager.errRes(res, 'unknown_password_reset_token');
                            return;
                        }
                        const user = yield userService.getUserByResetPasswordToken(token);
                        if (!user) {
                            errorManager.errRes(res, 'unknown_password_reset_token');
                            return;
                        }
                        const hashedPassword = (yield util.promisify(crypto.pbkdf2)(password, user.salt, 310000, 32, 'sha256')).toString('base64');
                        user.hashed_password = hashedPassword;
                        user.reset_password_token = undefined;
                        yield userService.editUserPassword(user);
                        res.status(200).json();
                    }));
                }
            }
            catch (error) {
                next(error);
            }
        });
    }
    sendResetPasswordEmail(user, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const emailClient = EmailClient.getInstance();
                emailClient
                    .send(user.email, 'Nango password reset', `<p><b>Reset your password</b></p>
                <p>Someone requested a password reset.</p>
                <p><a href="${baseUrl}/reset-password/${token}">Reset password</a></p>
                <p>If you didn't initiate this request, please contact us immediately at support@nango.dev</p>`)
                    .catch((e) => {
                    errorManager.report(e, { source: ErrorSourceEnum.PLATFORM, userId: user.id, operation: 'user' });
                });
            }
            catch (e) {
                errorManager.report(e, { userId: user.id, source: ErrorSourceEnum.PLATFORM, operation: 'user' });
            }
        });
    }
    invitation(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.query['token'];
                if (!token) {
                    res.status(400).send({ error: 'Token is missing' });
                    return;
                }
                const invitee = yield userService.getInvitedUserByToken(token);
                if (!invitee) {
                    errorManager.errRes(res, 'duplicate_account');
                    return;
                }
                res.status(200).send(invitee);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getManagedLogin(req, res, next) {
        try {
            const provider = req.query['provider'];
            if (!provider || !allowedProviders.includes(provider)) {
                errorManager.errRes(res, 'invalid_provider');
                return;
            }
            const workos = getWorkOSClient();
            const oAuthUrl = workos.userManagement.getAuthorizationUrl({
                clientId: process.env['WORKOS_CLIENT_ID'] || '',
                provider,
                redirectUri: `${basePublicUrl}/api/v1/login/callback`
            });
            res.send({ url: oAuthUrl });
        }
        catch (err) {
            next(err);
        }
    }
    getManagedLoginWithInvite(req, res, next) {
        try {
            const workos = getWorkOSClient();
            const provider = req.query['provider'];
            if (!provider || !allowedProviders.includes(provider)) {
                errorManager.errRes(res, 'invalid_provider');
                return;
            }
            const token = req.params['token'];
            const body = req.body;
            if (!body || body.accountId === undefined) {
                errorManager.errRes(res, 'missing_params');
                return;
            }
            if (!provider || !token) {
                errorManager.errRes(res, 'missing_params');
                return;
            }
            const accountId = body.accountId;
            const inviteParams = {
                accountId,
                token
            };
            const oAuthUrl = workos.userManagement.getAuthorizationUrl({
                clientId: process.env['WORKOS_CLIENT_ID'] || '',
                provider,
                redirectUri: `${basePublicUrl}/api/v1/login/callback`,
                state: Buffer.from(JSON.stringify(inviteParams)).toString('base64')
            });
            res.send({ url: oAuthUrl });
        }
        catch (err) {
            next(err);
        }
    }
    loginCallback(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { code, state } = req.query;
                const workos = getWorkOSClient();
                if (!code) {
                    const error = new NangoError('missing_managed_login_callback_code');
                    logger.error(error);
                    res.redirect(basePublicUrl);
                    return;
                }
                const { user: authorizedUser, organizationId } = yield workos.userManagement.authenticateWithCode({
                    clientId: process.env['WORKOS_CLIENT_ID'] || '',
                    code: code
                });
                const existingUser = yield userService.getUserByEmail(authorizedUser.email);
                if (existingUser) {
                    req.login(existingUser, function (err) {
                        if (err) {
                            return next(err);
                        }
                        res.redirect(`${basePublicUrl}/`);
                    });
                    return;
                }
                const name = authorizedUser.firstName || authorizedUser.lastName
                    ? `${authorizedUser.firstName || ''} ${authorizedUser.lastName || ''}`
                    : authorizedUser.email.split('@')[0];
                let accountId = null;
                if (organizationId) {
                    // in this case we have a pre registered organization with workos
                    // let's make sure it exists in our system
                    const organization = yield workos.organizations.getOrganization(organizationId);
                    const account = yield accountService.getOrCreateAccount(organization.name);
                    if (!account) {
                        throw new NangoError('account_creation_failure');
                    }
                    accountId = account.id;
                }
                else {
                    if (!name) {
                        throw new NangoError('missing_name_for_account_creation');
                    }
                    accountId = yield createAccountIfNotInvited(name, state);
                    if (!accountId) {
                        throw new NangoError('account_creation_failure');
                    }
                }
                const user = yield userService.createUser(authorizedUser.email, name, '', '', accountId);
                if (!user) {
                    throw new NangoError('user_creation_failure');
                }
                req.login(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.redirect(`${basePublicUrl}/`);
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
}
export default new AuthController();
//# sourceMappingURL=auth.controller.js.map