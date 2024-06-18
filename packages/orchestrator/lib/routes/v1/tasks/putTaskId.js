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
import { validateRequest } from '@nangohq/utils';
import { jsonSchema } from '../../../utils/validation.js';
const path = '/v1/tasks/:taskId';
const method = 'PUT';
const validate = validateRequest({
    parseBody: (data) => z
        .object({ output: jsonSchema, state: z.enum(['SUCCEEDED', 'FAILED']) })
        .strict()
        .parse(data),
    parseParams: (data) => z.object({ taskId: z.string().uuid() }).strict().parse(data)
});
const handler = (scheduler) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { taskId } = req.params;
        const { state, output } = req.body;
        let updated;
        switch (state) {
            case 'SUCCEEDED':
                updated = yield scheduler.succeed({ taskId: taskId, output: output });
                break;
            case 'FAILED':
                updated = yield scheduler.fail({ taskId: taskId, error: output });
                break;
            case 'CANCELLED':
                updated = yield scheduler.cancel({ taskId: taskId, reason: output });
                break;
            default:
                res.status(400).json({ error: { code: 'invalid_state', message: `Invalid state ${state}` } });
                return;
        }
        if (updated.isErr()) {
            res.status(500).json({ error: { code: 'put_task_failed', message: updated.error.message } });
            return;
        }
        res.status(200).json(updated.value);
        return;
    });
};
export const route = { path, method };
export const routeHandler = (scheduler) => {
    return Object.assign(Object.assign({}, route), { validate, handler: handler(scheduler) });
};
//# sourceMappingURL=putTaskId.js.map