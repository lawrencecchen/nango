var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ActionError } from '@nangohq/shared/lib/sdk/sync.js';
import { toTask } from '../mappers/to-task.js';
export default function runAction(nango, input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!input.parent && !input.projects) {
            throw new ActionError({
                type: 'validation_error',
                message: 'You must specify one of workspace, parent or projects. For more information on API status codes and how to handle them, read the docs on errors: https://developers.asana.com/docs/errors'
            });
        }
        const response = yield nango.post({
            endpoint: '/api/1.0/tasks',
            data: {
                data: input
            }
        });
        const { data } = response;
        return toTask(data.data);
    });
}
//# sourceMappingURL=create-task.js.map