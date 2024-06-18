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
import { model, envs, operationIdRegex } from '@nangohq/logs';
import { asyncWrapper } from '../../../utils/asyncWrapper.js';
const validation = z
    .object({
    operationId: operationIdRegex
})
    .strict();
export const getOperation = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!envs.NANGO_LOGS_ENABLED) {
        res.status(404).send({ error: { code: 'feature_disabled' } });
        return;
    }
    const emptyQuery = requireEmptyQuery(req, { withEnv: true });
    if (emptyQuery) {
        res.status(400).send({ error: { code: 'invalid_query_params', errors: zodErrorToHTTP(emptyQuery.error) } });
        return;
    }
    const val = validation.safeParse(req.params);
    if (!val.success) {
        res.status(400).send({
            error: { code: 'invalid_uri_params', errors: zodErrorToHTTP(val.error) }
        });
        return;
    }
    const { environment, account } = res.locals;
    try {
        const operation = yield model.getOperation({ id: val.data.operationId });
        if (operation.accountId !== account.id || operation.environmentId !== environment.id || !operation.operation) {
            res.status(404).send({ error: { code: 'not_found' } });
            return;
        }
        res.status(200).send({ data: operation });
    }
    catch (err) {
        if (err instanceof model.ResponseError && err.statusCode === 404) {
            res.status(404).send({ error: { code: 'not_found' } });
            return;
        }
        throw err;
    }
}));
//# sourceMappingURL=getOperation.js.map