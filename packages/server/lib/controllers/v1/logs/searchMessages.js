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
import { model, envs, operationIdRegex } from '@nangohq/logs';
import { requireEmptyQuery, zodErrorToHTTP } from '@nangohq/utils';
import { asyncWrapper } from '../../../utils/asyncWrapper.js';
const validation = z
    .object({
    operationId: operationIdRegex,
    limit: z.number().max(500).optional().default(100),
    search: z.string().max(100).optional(),
    states: z
        .array(z.enum(['all', 'waiting', 'running', 'success', 'failed', 'timeout', 'cancelled']))
        .max(10)
        .optional()
        .default(['all']),
    cursorBefore: z.string().or(z.null()).optional(),
    cursorAfter: z.string().or(z.null()).optional()
})
    .strict();
export const searchMessages = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        res.status(400).send({
            error: { code: 'invalid_body', errors: zodErrorToHTTP(val.error) }
        });
        return;
    }
    const { environment, account } = res.locals;
    // Manually ensure that `operationId` belongs to the account for now
    // Because not all the logs have accountId/environmentId
    try {
        const operation = yield model.getOperation({ id: val.data.operationId });
        if (operation.accountId !== account.id || operation.environmentId !== environment.id) {
            res.status(404).send({ error: { code: 'not_found' } });
            return;
        }
    }
    catch (err) {
        if (err instanceof model.ResponseError && err.statusCode === 404) {
            res.status(404).send({ error: { code: 'not_found' } });
            return;
        }
        throw err;
    }
    const body = val.data;
    const rawOps = yield model.listMessages({
        parentId: body.operationId,
        limit: body.limit,
        states: body.states,
        search: body.search,
        cursorBefore: body.cursorBefore,
        cursorAfter: body.cursorAfter
    });
    res.status(200).send({
        data: rawOps.items,
        pagination: { total: rawOps.count, cursorBefore: rawOps.cursorBefore, cursorAfter: rawOps.cursorAfter }
    });
}));
//# sourceMappingURL=searchMessages.js.map