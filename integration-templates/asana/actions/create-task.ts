import type { AsanaTask } from '@nangohq/types/lib/integration/asana';
import { toTask } from '../mappers/to-task.js';
import { ActionError, NangoAction } from '@nangohq/shared/lib/sdk/sync';

export default async function runAction(nango: NangoAction, input: any): Promise<AsanaTask> {
    if (!input.parent && !input.projects) {
        throw new ActionError({
            type: 'validation_error',
            message:
                'You must specify one of workspace, parent or projects. For more information on API status codes and how to handle them, read the docs on errors: https://developers.asana.com/docs/errors'
        });
    }

    const response = await nango.post({
        endpoint: '/api/1.0/tasks',
        data: {
            data: input
        }
    });

    const { data } = response;

    return toTask(data.data);
}
