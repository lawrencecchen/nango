var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as cron from 'node-cron';
import { errorManager, ErrorSourceEnum } from '@nangohq/shared';
import tracer from 'dd-trace';
import { envs, model } from '@nangohq/logs';
import { getLogger } from '@nangohq/utils';
const logger = getLogger('Jobs.TimeoutLogsOperations');
export function timeoutLogsOperations() {
    if (!envs.NANGO_LOGS_ENABLED) {
        return;
    }
    cron.schedule('*/10 * * * *', 
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    () => __awaiter(this, void 0, void 0, function* () {
        try {
            logger.info(`Timeouting old operations...`);
            yield model.setTimeoutForAll();
            logger.info(`✅ Timeouted`);
        }
        catch (err) {
            errorManager.report(err, { source: ErrorSourceEnum.PLATFORM }, tracer);
        }
    }));
}
//# sourceMappingURL=timeoutLogsOperations.js.map