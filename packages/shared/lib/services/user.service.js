var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db from '@nangohq/database';
import * as uuid from 'uuid';
import { isEnterprise, Ok, Err } from '@nangohq/utils';
const VERIFICATION_EMAIL_EXPIRATION = 3 * 24 * 60 * 60 * 1000;
const INVITE_EMAIL_EXPIRATION = 7 * 24 * 60 * 60 * 1000;
class UserService {
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('*').from(`_nango_users`).where({ id });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            if (result[0].suspended) {
                return null;
            }
            return result[0];
        });
    }
    getUserByUuid(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('*').from(`_nango_users`).where({ uuid }).first();
            return result || null;
        });
    }
    getUserAndAccountByToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .select('*', '_nango_accounts.id as account_id', '_nango_users.id as user_id')
                .from(`_nango_users`)
                .join('_nango_accounts', '_nango_accounts.id', '_nango_users.account_id')
                .where({ email_verification_token: token })
                .first();
            if (result) {
                const expired = new Date(result.email_verification_token_expires_at).getTime() < new Date().getTime();
                if (expired) {
                    return Err(new Error('token_expired'));
                }
            }
            return Ok(result) || Err(new Error('user_not_found'));
        });
    }
    refreshEmailVerificationToken(expiredToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const newToken = uuid.v4();
            const expires_at = new Date(new Date().getTime() + VERIFICATION_EMAIL_EXPIRATION);
            const result = yield db.knex
                .from(`_nango_users`)
                .where({ email_verification_token: expiredToken })
                .update({
                email_verification_token: newToken,
                email_verification_token_expires_at: expires_at
            })
                .returning('*');
            return result[0] || null;
        });
    }
    getUsersByAccountId(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('id', 'name', 'email', 'suspended').from(`_nango_users`).where({ account_id: accountId });
            if (result == null || result.length == 0 || result[0] == null) {
                return [];
            }
            return result;
        });
    }
    getAnUserByAccountId(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .select('*')
                .from(`_nango_users`)
                .where({
                account_id: accountId,
                suspended: false
            })
                .orderBy('id', 'asc')
                .limit(1);
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0];
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('*').from(`_nango_users`).where({ email: email });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0];
        });
    }
    getUserByResetPasswordToken(link) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('*').from(`_nango_users`).where({ reset_password_token: link });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0];
        });
    }
    createUser(email, name, hashed_password, salt, account_id, email_verified = true) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const expires_at = new Date(new Date().getTime() + VERIFICATION_EMAIL_EXPIRATION);
            const result = yield db.knex
                .from('_nango_users')
                .insert({
                email,
                name,
                hashed_password,
                salt,
                account_id,
                email_verified,
                email_verification_token: email_verified ? null : uuid.v4(),
                email_verification_token_expires_at: email_verified ? null : expires_at
            })
                .returning('id');
            if (result.length === 1 && ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.id)) {
                const userId = result[0].id;
                return this.getUserById(userId);
            }
            return null;
        });
    }
    editUserPassword(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex.from(`_nango_users`).where({ id: user.id }).update({
                reset_password_token: user.reset_password_token,
                hashed_password: user.hashed_password
            });
        });
    }
    editUserName(name, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex.from(`_nango_users`).where({ id }).update({ name, updated_at: new Date() });
        });
    }
    changePassword(newPassword, oldPassword, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex.from(`_nango_users`).where({ id }).update({
                hashed_password: newPassword,
                salt: oldPassword
            });
        });
    }
    suspendUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (id !== null && id !== undefined) {
                yield db.knex.from(`_nango_users`).where({ id }).update({ suspended: true, suspended_at: new Date() });
            }
        });
    }
    verifyUserEmail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex.from(`_nango_users`).where({ id }).update({ email_verified: true, email_verification_token: null });
        });
    }
    inviteUser(email, name, accountId, inviter_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = uuid.v4();
            const expires_at = new Date(new Date().getTime() + INVITE_EMAIL_EXPIRATION);
            const result = yield db.knex
                .from(`_nango_invited_users`)
                .insert({
                email,
                name,
                account_id: accountId,
                invited_by: inviter_id,
                token,
                expires_at
            })
                .returning('*');
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0];
        });
    }
    getInvitedUsersByAccountId(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const date = new Date();
            const result = yield db.knex.select('*').from(`_nango_invited_users`).where({ account_id: accountId }).whereRaw('expires_at > ?', date);
            return result || [];
        });
    }
    getInvitedUserByToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const date = new Date();
            if (isEnterprise && process.env['NANGO_ADMIN_INVITE_TOKEN'] === token) {
                return {
                    id: 1,
                    email: '',
                    name: '',
                    account_id: 0,
                    invited_by: 0,
                    token: '',
                    expires_at: new Date(),
                    accepted: true
                };
            }
            const result = yield db.knex.select('*').from(`_nango_invited_users`).where({ token }).whereRaw('expires_at > ?', date);
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0];
        });
    }
    markAcceptedInvite(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.from(`_nango_invited_users`).where({ token }).update({ accepted: true });
            return result;
        });
    }
}
export default new UserService();
//# sourceMappingURL=user.service.js.map