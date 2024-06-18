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
import { externalWebhookService } from '@nangohq/shared';
import { asyncWrapper } from '../../../../utils/asyncWrapper.js';
const validation = z
    .object({
    alwaysSendWebhook: z.boolean(),
    sendAuthWebhook: z.boolean(),
    sendRefreshFailedWebhook: z.boolean(),
    sendSyncFailedWebhook: z.boolean()
})
    .strict();
export const patchSettings = asyncWrapper((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const { environment } = res.locals;
    const { data: settings } = val;
    yield externalWebhookService.update(environment.id, settings);
    res.send(settings);
}));
//# sourceMappingURL=patchSettings.js.map