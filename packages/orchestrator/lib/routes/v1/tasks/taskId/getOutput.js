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
const path = '/v1/tasks/:taskId/output';
const method = 'GET';
const validate = validateRequest({
    parseQuery: (data) => z
        .object({
        longPolling: z
            .string()
            .optional()
            .default('false')
            .transform((val) => val === 'true')
    })
        .parse(data),
    parseParams: (data) => z.object({ taskId: z.string().uuid() }).strict().parse(data)
});
const handler = (scheduler, eventEmitter) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const longPollingTimeoutMs = 120000;
        const eventId = `task:completed:${req.params.taskId}`;
        const cleanupAndRespond = (respond) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (onCompletion) {
                eventEmitter.removeListener(eventId, onCompletion);
            }
            if (!res.writableEnded) {
                respond(res);
            }
        };
        const onCompletion = (completedTask) => {
            cleanupAndRespond((res) => res.status(200).json({ state: completedTask.state, output: completedTask.output }));
        };
        const timeout = setTimeout(() => {
            cleanupAndRespond((res) => res.status(204).send());
        }, longPollingTimeoutMs);
        eventEmitter.once(eventId, onCompletion);
        const task = yield scheduler.get({ taskId: req.params.taskId });
        if (task.isErr()) {
            cleanupAndRespond((res) => res.status(404).json({ error: { code: 'task_not_found', message: task.error.message } }));
            return;
        }
        if (req.query.longPolling && (task.value.state === 'CREATED' || task.value.state === 'STARTED')) {
            yield new Promise((resolve) => resolve(timeout));
        }
        else {
            cleanupAndRespond((res) => res.status(200).json({ state: task.value.state, output: task.value.output }));
        }
        return;
    });
};
export const route = { path, method };
export const routeHandler = (scheduler, eventEmmiter) => {
    return Object.assign(Object.assign({}, route), { validate, handler: handler(scheduler, eventEmmiter) });
};
//# sourceMappingURL=getOutput.js.map