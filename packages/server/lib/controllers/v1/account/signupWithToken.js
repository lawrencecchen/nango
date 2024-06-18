var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { z } from 'zod';
import crypto from 'crypto';
import util from 'util';
import { getLogger, isCloud, requireEmptyQuery, zodErrorToHTTP } from '@nangohq/utils';
import { analytics, AnalyticsTypes, userService, accountService } from '@nangohq/shared';
import { asyncWrapper } from '../../../utils/asyncWrapper.js';
const logger = getLogger('Server.SignupWithToken');
const validation = z
    .object({
    email: z.string().email(),
    name: z.string(),
    password: z.string().min(8),
    token: z.string().min(6),
    accountId: z.number()
})
    .strict();
export const signupWithToken = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const emptyQuery = requireEmptyQuery(req);
    if (emptyQuery) {
        res.status(400).send({ error: { code: 'invalid_query_params', errors: zodErrorToHTTP(emptyQuery.error) } });
        return;
    }
    const val = validation.safeParse(req.body);
    if (!val.success) {
        res.status(400).send({
            error: { code: 'invalid_body', errors: zodErrorToHTTP(val.error) }
        });
        return;
    }
    const { email, password, name, accountId, token } = val.data;
    if ((yield userService.getUserByEmail(email)) !== null) {
        res.status(400).send({ error: { code: 'user_already_exists', message: 'User with this email already exists' } });
        return;
    }
    const validToken = yield userService.getInvitedUserByToken(token);
    if (!validToken) {
        res.status(400).send({ error: { code: 'invalid_invite_token', message: 'The token used was found to be invalid.' } });
        return;
    }
    const account = yield accountService.getAccountById(accountId);
    if (!account) {
        res.status(400).send({ error: { code: 'invalid_account_id', message: 'The account ID provided is invalid.' } });
        return;
    }
    const salt = crypto.randomBytes(16).toString('base64');
    const hashedPassword = (yield util.promisify(crypto.pbkdf2)(password, salt, 310000, 32, 'sha256')).toString('base64');
    const user = yield userService.createUser(email, name, hashedPassword, salt, account.id);
    if (!user) {
        res.status(500).send({ error: { code: 'error_creating_user', message: 'There was a problem creating the user. Please reach out to support.' } });
        return;
    }
    void analytics.track(AnalyticsTypes.ACCOUNT_JOINED, account.id, {}, isCloud ? { email } : {});
    yield userService.markAcceptedInvite(token);
    req.login(user, function (err) {
        if (err) {
            logger.error('Error logging in user');
            res.status(500).send({ error: { code: 'error_logging_in', message: 'There was a problem logging in the user. Please reach out to support.' } });
            return;
        }
        const webUser = {
            id: user.id,
            accountId: user.account_id,
            email: user.email,
            name: user.name
        };
        res.status(200).send({ user: webUser });
    });
}));
//# sourceMappingURL=signupWithToken.js.map