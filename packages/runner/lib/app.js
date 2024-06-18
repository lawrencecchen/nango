import './tracer.js';
import { getLogger, stringifyError } from '@nangohq/utils';
import { server } from './server.js';
const logger = getLogger('Runner');
try {
    const port = parseInt(process.argv[2] || '') || 3006;
    const id = process.argv[3] || process.env['RUNNER_ID'] || 'unknown-id';
    server.listen(port, () => {
        logger.info(`🚀 '${id}' ready at http://localhost:${port}`);
    });
}
catch (err) {
    logger.error(`Unable to start runner: ${stringifyError(err)}`);
    process.exit(1);
}
//# sourceMappingURL=app.js.map