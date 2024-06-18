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
import { connectionService } from '@nangohq/shared';
import db from '@nangohq/database';
import { asyncWrapper } from '../../utils/asyncWrapper.js';
const validation = z
    .object({
    connection_id: z.union([z.string().min(1), z.array(z.string().min(1))]),
    provider_config_key: z.string().min(1),
    metadata: z.record(z.unknown())
})
    .strict();
export const setMetadata = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const { environment } = res.locals;
    const body = val.data;
    const { connection_id: connectionIdArg, provider_config_key: providerConfigKey, metadata } = body;
    const connectionIds = Array.isArray(connectionIdArg) ? connectionIdArg : [connectionIdArg];
    const ids = [];
    for (const connectionId of connectionIds) {
        const { success, response: connection } = yield connectionService.getConnection(connectionId, providerConfigKey, environment.id);
        if (!success || !connection || !connection.id) {
            const baseMessage = `Connection with connection id ${connectionId} and provider config key ${providerConfigKey} not found. Please make sure the connection exists in the Nango dashboard`;
            const error = connectionIds.length > 1
                ? {
                    error: {
                        code: 'unknown_connection',
                        message: `${baseMessage}. No actions were taken on any of the connections as a result of this failure.`
                    }
                }
                : {
                    error: {
                        code: 'unknown_connection',
                        message: baseMessage
                    }
                };
            res.status(404).json(error);
            return;
        }
        ids.push(connection.id);
    }
    yield db.knex.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
        yield connectionService.replaceMetadata(ids, metadata, trx);
    }));
    res.status(201).send(req.body);
}));
//# sourceMappingURL=setMetadata.js.map