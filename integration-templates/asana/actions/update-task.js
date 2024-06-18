var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { toTask } from '../mappers/to-task.js';
export default function runAction(nango, input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!input.id) {
            throw new nango.ActionError({
                type: 'validation_error',
                message: 'You must specify a task id (gid) to update.'
            });
        }
        const normalizedInput = normalizeDates(input);
        const response = yield nango.put({
            endpoint: `/api/1.0/tasks/${input.id}`,
            data: {
                data: normalizedInput
            }
        });
        const { data } = response;
        return toTask(data.data);
    });
}
function normalizeDates(input) {
    return Object.assign(Object.assign({}, input), { due_on: input.due_on ? new Date(input.due_on).toISOString() : undefined, due_at: input.due_at ? new Date(input.due_at).toISOString() : undefined });
}
//# sourceMappingURL=update-task.js.map