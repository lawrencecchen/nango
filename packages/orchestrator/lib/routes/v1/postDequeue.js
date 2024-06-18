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
const path = '/v1/dequeue';
const method = 'POST';
const validate = validateRequest({
    parseBody: (data) => z
        .object({
        groupKey: z.string().min(1),
        limit: z.coerce.number().positive(),
        longPolling: z.coerce.boolean()
    })
        .strict()
        .parse(data)
});
export const route = { path, method };
export const routeHandler = (scheduler, eventEmitter) => {
    return Object.assign(Object.assign({}, route), { validate, handler: handler(scheduler, eventEmitter) });
};
const handler = (scheduler, eventEmitter) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { groupKey, limit, longPolling: longPolling } = req.body;
        const longPollingTimeoutMs = 60000;
        const eventId = `task:created:${groupKey}`;
        const cleanupAndRespond = (respond) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (onTaskStarted) {
                eventEmitter.removeListener(eventId, onTaskStarted);
            }
            if (!res.writableEnded) {
                respond(res);
            }
        };
        const onTaskStarted = (_t) => __awaiter(void 0, void 0, void 0, function* () {
            cleanupAndRespond((res) => __awaiter(void 0, void 0, void 0, function* () {
                const getTasks = yield scheduler.dequeue({ groupKey, limit });
                if (getTasks.isErr()) {
                    res.status(500).json({ error: { code: 'dequeue_failed', message: getTasks.error.message } });
                }
                else {
                    res.status(200).json(getTasks.value);
                }
            }));
        });
        const timeout = setTimeout(() => {
            cleanupAndRespond((res) => res.status(200).send([]));
        }, longPollingTimeoutMs);
        const getTasks = yield scheduler.dequeue({ groupKey, limit });
        if (getTasks.isErr()) {
            cleanupAndRespond((res) => res.status(500).json({ error: { code: 'dequeue_failed', message: getTasks.error.message } }));
            return;
        }
        if (longPolling && getTasks.value.length === 0) {
            eventEmitter.once(eventId, onTaskStarted);
            yield new Promise((resolve) => resolve(timeout));
        }
        else {
            cleanupAndRespond((res) => res.status(200).json(getTasks.value));
        }
        return;
    });
};
//# sourceMappingURL=postDequeue.js.map