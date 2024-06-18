import { z } from 'zod';
import { requireEmptyQuery, zodErrorToHTTP } from '@nangohq/utils';
import type { SearchFilters } from '@nangohq/types';
import { model, envs } from '@nangohq/logs';

import { asyncWrapper } from '../../../utils/asyncWrapper.js';

const validation = z
    .object({
        category: z.enum(['integration', 'connection', 'syncConfig']),
        search: z.string().optional()
    })
    .strict();

export const searchFilters = asyncWrapper<SearchFilters>(async (req, res) => {
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
    const body: SearchFilters['Body'] = val.data;
    const rawOps = await model.listFilters({ accountId: env.account_id, environmentId: env.id, category: body.category, limit: 20, search: body.search });

    res.status(200).send({
        data: rawOps.items
    });
});
