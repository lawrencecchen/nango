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
import { getLogger, requireEmptyQuery, zodErrorToHTTP } from '@nangohq/utils';
import { analytics, userService, AnalyticsTypes, environmentService, createOnboardingProvider } from '@nangohq/shared';
import { asyncWrapper } from '../../../utils/asyncWrapper.js';
const logger = getLogger('Server.ValidateEmailAndLogin');
const validation = z
    .object({
    token: z.string().min(6)
})
    .strict();
export const validateEmailAndLogin = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const { token } = val.data;
    const tokenResponse = yield userService.getUserAndAccountByToken(token);
    if (tokenResponse.isErr()) {
        const error = tokenResponse.error;
        if (error.message === 'token_expired') {
            res.status(400).send({
                error: {
                    code: 'token_expired',
                    message: 'The token has expired. An email has been sent with a new token.'
                }
            });
        }
        else {
            logger.error('Error validating user');
            res.status(500).send({
                error: { code: 'error_validating_user', message: 'There was a problem validating the user. Please reach out to support.' }
            });
        }
        return;
    }
    const userAndAccount = tokenResponse.value;
    yield userService.verifyUserEmail(userAndAccount.user_id);
    const { user_id, account_id, email } = userAndAccount;
    void analytics.track(AnalyticsTypes.ACCOUNT_CREATED, account_id, {}, { email });
    const env = yield environmentService.getByEnvironmentName(account_id, 'dev');
    if (env) {
        try {
            yield createOnboardingProvider({ envId: env.id });
        }
        catch (_a) {
            logger.error(`Error creating onboarding provider for environment ${env.id}`);
        }
    }
    const user = {
        id: user_id,
        accountId: account_id,
        email,
        name: userAndAccount.name
    };
    req.login(user, function (err) {
        if (err) {
            logger.error('Error logging in user');
            res.status(500).send({ error: { code: 'error_logging_in', message: 'There was a problem logging in the user. Please reach out to support.' } });
            return;
        }
        res.status(200).send({ user });
    });
}));
//# sourceMappingURL=validateEmailAndLogin.js.map