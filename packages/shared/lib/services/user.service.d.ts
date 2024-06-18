import type { Result } from '@nangohq/utils';

import type { User, InviteUser, Account } from '../models/Admin.js';
declare class UserService {
    getUserById(id: number): Promise<User | null>;
    getUserByUuid(uuid: string): Promise<User | null>;
    getUserAndAccountByToken(token: string): Promise<
        Result<
            User &
                Account & {
                    account_id: number;
                    user_id: number;
                }
        >
    >;
    refreshEmailVerificationToken(expiredToken: string): Promise<User | null>;
    getUsersByAccountId(accountId: number): Promise<User[]>;
    getAnUserByAccountId(accountId: number): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    getUserByResetPasswordToken(link: string): Promise<User | null>;
    createUser(email: string, name: string, hashed_password: string, salt: string, account_id: number, email_verified?: boolean): Promise<User | null>;
    editUserPassword(user: User): Promise<any>;
    editUserName(name: string, id: number): Promise<any>;
    changePassword(newPassword: string, oldPassword: string, id: number): Promise<any>;
    suspendUser(id: number): Promise<void>;
    verifyUserEmail(id: number): Promise<any>;
    inviteUser(email: string, name: string, accountId: number, inviter_id: number): Promise<any>;
    getInvitedUsersByAccountId(accountId: number): Promise<InviteUser[]>;
    getInvitedUserByToken(token: string): Promise<InviteUser | null>;
    markAcceptedInvite(token: string): Promise<any>;
}
declare const _default: UserService;
export default _default;
