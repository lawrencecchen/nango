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
import { syncArgsSchema } from '../../clients/validate.js';
const path = '/v1/recurring';
const method = 'POST';
const validate = validateRequest({
    parseBody: (data) => {
        return z
            .object({
            name: z.string().min(1),
            state: z.enum(['STARTED', 'PAUSED']),
            startsAt: z.coerce.date(),
            frequencyMs: z.number().int().positive(),
            groupKey: z.string().min(1),
            retry: z.object({
                max: z.number().int()
            }),
            timeoutSettingsInSecs: z.object({
                createdToStarted: z.number().int().positive(),
                startedToCompleted: z.number().int().positive(),
                heartbeat: z.number().int().positive()
            }),
            args: syncArgsSchema
        })
            .strict()
            .parse(data);
    }
});
const handler = (scheduler) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield scheduler.recurring({
            name: req.body.name,
            state: req.body.state,
            payload: req.body.args,
            startsAt: req.body.startsAt,
            frequencyMs: req.body.frequencyMs,
            groupKey: req.body.groupKey,
            retryMax: req.body.retry.max,
            createdToStartedTimeoutSecs: req.body.timeoutSettingsInSecs.createdToStarted,
            startedToCompletedTimeoutSecs: req.body.timeoutSettingsInSecs.startedToCompleted,
            heartbeatTimeoutSecs: req.body.timeoutSettingsInSecs.heartbeat
        });
        if (schedule.isErr()) {
            return res.status(500).json({ error: { code: 'recurring_failed', message: schedule.error.message } });
        }
        return res.status(200).json({ scheduleId: schedule.value.id });
    });
};
export const route = { path, method };
export const routeHandler = (scheduler) => {
    return Object.assign(Object.assign({}, route), { validate, handler: handler(scheduler) });
};
//# sourceMappingURL=postRecurring.js.map