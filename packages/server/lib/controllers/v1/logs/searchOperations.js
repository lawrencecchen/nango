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
    limit: z.number().max(500).optional().default(100),
    states: z
        .array(z.enum(['all', 'waiting', 'running', 'success', 'failed', 'timeout', 'cancelled']))
        .max(10)
        .optional()
        .default(['all']),
    types: z
        .array(z.enum([
        'all',
        'action',
        'sync',
        'sync:init',
        'sync:cancel',
        'sync:pause',
        'sync:unpause',
        'sync:run',
        'sync:request_run',
        'sync:request_run_full',
        'proxy',
        'deploy',
        'auth',
        'admin',
        'webhook'
    ]))
        .max(20)
        .optional()
        .default(['all']),
    integrations: z.array(z.string()).max(10).optional().default(['all']),
    connections: z.array(z.string()).max(10).optional().default(['all']),
    syncs: z.array(z.string()).max(10).optional().default(['all']),
    period: z.object({ from: z.string().datetime(), to: z.string().datetime() }).optional(),
    cursor: z.string().or(z.null()).optional()
})
    .strict();
export const searchOperations = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const env = res.locals['environment'];
    const body = val.data;
    const rawOps = yield model.listOperations({
        accountId: env.account_id,
        environmentId: env.id,
        limit: body.limit,
        states: body.states,
        types: body.types,
        integrations: body.integrations,
        connections: body.connections,
        syncs: body.syncs,
        period: body.period,
        cursor: body.cursor
    });
    res.status(200).send({
        data: rawOps.items,
        pagination: { total: rawOps.count, cursor: rawOps.cursor }
    });
}));
//# sourceMappingURL=searchOperations.js.map