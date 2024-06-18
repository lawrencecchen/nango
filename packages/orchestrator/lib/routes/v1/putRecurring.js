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
const path = '/v1/recurring';
const method = 'PUT';
const validate = validateRequest({
    parseBody: (data) => {
        return z
            .object({
            schedule: z.union([
                z.object({
                    name: z.string().min(1),
                    state: z.union([z.literal('STARTED'), z.literal('PAUSED'), z.literal('DELETED')])
                }),
                z.object({
                    name: z.string().min(1),
                    frequencyMs: z.number().int().positive()
                })
            ])
        })
            .strict()
            .parse(data);
    }
});
const handler = (scheduler) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { schedule } = req.body;
        let updatedSchedule;
        if ('state' in schedule) {
            updatedSchedule = yield scheduler.setScheduleState({ scheduleName: schedule.name, state: schedule.state });
        }
        if ('frequencyMs' in schedule) {
            updatedSchedule = yield scheduler.setScheduleFrequency({ scheduleName: schedule.name, frequencyMs: schedule.frequencyMs });
        }
        if (!updatedSchedule) {
            return res.status(400).json({ error: { code: 'put_recurring_failed', message: `invalid parameters: ${schedule}` } });
        }
        if (updatedSchedule.isErr()) {
            return res.status(500).json({ error: { code: 'put_recurring_failed', message: updatedSchedule.error.message } });
        }
        return res.status(200).json({ scheduleId: updatedSchedule.value.id });
    });
};
export const route = { path, method };
export const routeHandler = (scheduler) => {
    return Object.assign(Object.assign({}, route), { validate, handler: handler(scheduler) });
};
//# sourceMappingURL=putRecurring.js.map