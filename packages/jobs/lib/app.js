import './tracer.js';
import { getLogger, stringifyError } from '@nangohq/utils';
import db from '@nangohq/database';
import { Temporal } from './temporal.js';
import { Processor } from './processor/processor.js';
import { server } from './server.js';
import { cronAutoIdleDemo } from './crons/autoIdleDemo.js';
import { deleteOldActivityLogs } from './crons/deleteOldActivities.js';
import { deleteSyncsData } from './crons/deleteSyncsData.js';
import { reconcileTemporalSchedules } from './crons/reconcileTemporalSchedules.js';
import { timeoutLogsOperations } from './crons/timeoutLogsOperations.js';
import { envs } from './env.js';
const logger = getLogger('Jobs');
try {
    const port = envs.NANGO_JOBS_PORT;
    const temporalNs = envs.TEMPORAL_NAMESPACE;
    const orchestratorServiceUrl = envs.ORCHESTRATOR_SERVICE_URL;
    server.listen(port);
    logger.info(`🚀 service ready at http://localhost:${port}`);
    const temporal = new Temporal(temporalNs);
    const processor = new Processor(orchestratorServiceUrl);
    // This promise never resolve
    void temporal.start();
    processor.start();
    db.enableMetrics();
    // Register recurring tasks
    cronAutoIdleDemo();
    deleteOldActivityLogs();
    deleteSyncsData();
    reconcileTemporalSchedules();
    timeoutLogsOperations();
    // handle SIGTERM
    process.on('SIGTERM', () => {
        temporal.stop();
        processor.stop();
        server.server.close(() => {
            process.exit(0);
        });
    });
}
catch (err) {
    logger.error(stringifyError(err));
    process.exit(1);
}
//# sourceMappingURL=app.js.map