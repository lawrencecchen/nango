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
import { requireEmptyQuery, zodErrorToHTTP } from '@nangohq/utils';
import { asyncWrapper } from '../../../utils/asyncWrapper.js';
import { getUserFromSession } from '../../../utils/utils.js';
const validation = z
    .object({
    email: z.string().email(),
    password: z.string().min(8)
})
    .strict();
export const signin = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const getUser = yield getUserFromSession(req);
    if (getUser.isErr()) {
        res.status(401).send({ error: { code: 'unauthorized', message: getUser.error.message } });
        return;
    }
    const user = getUser.value;
    if (!user.email_verified) {
        // since a session is created to get the user info we need to destroy it
        // since the user is not verified even if they exist and the credentials
        // are correct
        req.session.destroy(() => {
            res.status(400).send({ error: { code: 'email_not_verified' } });
        });
        return;
    }
    const webUser = {
        id: user.id,
        accountId: user.account_id,
        email: user.email,
        name: user.name
    };
    res.status(200).send({ user: webUser });
}));
//# sourceMappingURL=signin.js.map