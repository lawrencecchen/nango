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
const path = '/v1/tasks/search';
const method = 'POST';
const validate = validateRequest({
    parseBody: (data) => z
        .object({
        groupKey: z.string().min(1).optional(),
        limit: z.coerce.number().positive().optional(),
        ids: z.array(z.string().uuid()).optional()
    })
        .strict()
        .parse(data)
});
const handler = (scheduler) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { ids, groupKey, limit } = req.body;
        const getTasks = yield scheduler.searchTasks(Object.assign(Object.assign(Object.assign({}, (ids ? { ids } : {})), (groupKey ? { groupKey } : {})), (limit ? { limit } : {})));
        if (getTasks.isErr()) {
            return res.status(500).json({ error: { code: 'search_failed', message: getTasks.error.message } });
        }
        return res.status(200).json(getTasks.value);
    });
};
export const route = { path, method };
export const routeHandler = (scheduler) => {
    return Object.assign(Object.assign({}, route), { validate, handler: handler(scheduler) });
};
//# sourceMappingURL=postSearch.js.map