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
import { userService } from '@nangohq/shared';
import { requireEmptyQuery, zodErrorToHTTP } from '@nangohq/utils';
import { sendVerificationEmail } from '../../../helpers/email.js';
import { asyncWrapper } from '../../../utils/asyncWrapper.js';
const validation = z
    .object({
    uuid: z.string().uuid()
})
    .strict();
export const resendVerificationEmailByUuid = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const { uuid } = val.data;
    const user = yield userService.getUserByUuid(uuid);
    if (!user) {
        res.status(404).send({ error: { code: 'user_not_found', message: 'User was not found in our system.' } });
        return;
    }
    if (!user.email_verification_token) {
        res.status(400).send({ error: { code: 'email_already_verified', message: 'Email address was already verified, please login.' } });
        return;
    }
    sendVerificationEmail(user.email, user.name, user.email_verification_token);
    res.status(200).send({ success: true });
}));
//# sourceMappingURL=resendVerificationEmailByUuid.js.map