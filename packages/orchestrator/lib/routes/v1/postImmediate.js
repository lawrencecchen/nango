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
import { syncArgsSchema, actionArgsSchema, postConnectionArgsSchema, webhookArgsSchema } from '../../clients/validate.js';
const path = '/v1/immediate';
const method = 'POST';
const validate = validateRequest({
    parseBody: (data) => {
        function argsSchema(data) {
            if ('args' in data && 'type' in data.args) {
                switch (data.args.type) {
                    case 'sync':
                        return syncArgsSchema;
                    case 'action':
                        return actionArgsSchema;
                    case 'webhook':
                        return webhookArgsSchema;
                    case 'post-connection-script':
                        return postConnectionArgsSchema;
                    default:
                        throw new Error(`Invalid task type: '${data.args.type}'`);
                }
            }
            throw new Error('Missing task type');
        }
        return z
            .object({
            name: z.string().min(1),
            groupKey: z.string().min(1),
            retry: z.object({
                count: z.number().int(),
                max: z.number().int()
            }),
            timeoutSettingsInSecs: z.object({
                createdToStarted: z.number().int().positive(),
                startedToCompleted: z.number().int().positive(),
                heartbeat: z.number().int().positive()
            }),
            args: argsSchema(data)
        })
            .strict()
            .parse(data);
    }
});
const handler = (scheduler) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield scheduler.immediate({
            name: req.body.name,
            payload: req.body.args,
            groupKey: req.body.groupKey,
            retryMax: req.body.retry.max,
            retryCount: req.body.retry.count,
            createdToStartedTimeoutSecs: req.body.timeoutSettingsInSecs.createdToStarted,
            startedToCompletedTimeoutSecs: req.body.timeoutSettingsInSecs.startedToCompleted,
            heartbeatTimeoutSecs: req.body.timeoutSettingsInSecs.heartbeat
        });
        if (task.isErr()) {
            return res.status(500).json({ error: { code: 'immediate_failed', message: task.error.message } });
        }
        return res.status(200).json({ taskId: task.value.id });
    });
};
export const route = { path, method };
export const routeHandler = (scheduler) => {
    return Object.assign(Object.assign({}, route), { validate, handler: handler(scheduler) });
};
//# sourceMappingURL=postImmediate.js.map