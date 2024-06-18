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
import { model, envs } from '@nangohq/logs';
import { asyncWrapper } from '../../../utils/asyncWrapper.js';
const validation = z
    .object({
    category: z.enum(['integration', 'connection', 'syncConfig']),
    search: z.string().optional()
})
    .strict();
export const searchFilters = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!envs.NANGO_LOGS_ENABLED) {
        res.status(404).send({ error: { code: 'feature_disabled' } });
        return;
    }
    const emptyQuery = requireEmptyQuery(req, { withEnv: true });
    if (emptyQuery) {
        res.status(400).send({ error: { code: 'invalid_query_params', errors: zodErrorToHTTP(emptyQuery.error) } });
        return;
    }
    const val = validation.safeParse(req.body);
    if (!val.success) {
        res.status(400).send({ error: { code: 'invalid_body', errors: zodErrorToHTTP(val.error) } });
        return;
    }
    const env = res.locals['environment'];
    const body = val.data;
    const rawOps = yield model.listFilters({ accountId: env.account_id, environmentId: env.id, category: body.category, limit: 20, search: body.search });
    res.status(200).send({
        data: rawOps.items
    });
}));
//# sourceMappingURL=searchFilters.js.map