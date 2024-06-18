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
const path = '/v1/tasks/:taskId/heartbeat';
const method = 'POST';
const validate = validateRequest({
    parseParams: (data) => z.object({ taskId: z.string().uuid() }).strict().parse(data)
});
const handler = (scheduler) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { taskId } = req.params;
        const heartbeat = yield scheduler.heartbeat({ taskId: taskId });
        if (heartbeat.isErr()) {
            res.status(500).json({ error: { code: 'post_heartbeat_failed', message: heartbeat.error.message } });
            return;
        }
        res.status(204).send();
        return;
    });
};
export const route = { path, method };
export const routeHandler = (scheduler) => {
    return Object.assign(Object.assign({}, route), { validate, handler: handler(scheduler) });
};
//# sourceMappingURL=postHeartbeat.js.map