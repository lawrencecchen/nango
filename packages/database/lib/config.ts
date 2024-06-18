import { getDbConfig } from './getConfig.js.js';

const config = getDbConfig({ timeoutMs: 60000 });

export { config };
