import { Ok, Err } from '@nangohq/utils';
import { syncAbortControllers } from './state.js';
export const cancel = (syncId) => {
    const abortController = syncAbortControllers.get(syncId);
    if (abortController) {
        abortController.abort();
        return Ok('cancelled');
    }
    else {
        return Err('child process not found');
    }
};
//# sourceMappingURL=cancel.js.map