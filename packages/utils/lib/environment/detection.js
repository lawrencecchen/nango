var _a, _b;
import { NodeEnv, localhostUrl } from './constants.js';
export const baseUrl = process.env['NANGO_SERVER_URL'] || localhostUrl;
export const basePublicUrl = process.env['NANGO_PUBLIC_SERVER_URL'] || baseUrl;
export const isDocker = process.env['SERVER_RUN_MODE'] === 'DOCKERIZED';
export const isStaging = process.env['NODE_ENV'] === NodeEnv.Staging;
export const isProd = process.env['NODE_ENV'] === NodeEnv.Prod;
export const isCloud = ((_a = process.env['NANGO_CLOUD']) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'true';
export const isEnterprise = ((_b = process.env['NANGO_ENTERPRISE']) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'true';
export const isLocal = !isCloud && !isEnterprise && !isDocker && (process.env['NODE_ENV'] === NodeEnv.Dev || !process.env['NODE_ENV']);
export const isTest = Boolean(process.env['CI'] !== undefined || process.env['VITEST']);
export const isBasicAuthEnabled = !isCloud && process.env['NANGO_DASHBOARD_USERNAME'] && process.env['NANGO_DASHBOARD_PASSWORD'];
export const isHosted = !isCloud && !isLocal && !isEnterprise;
export const AUTH_ENABLED = isCloud || isEnterprise;
export const MANAGED_AUTH_ENABLED = isCloud || isLocal;
export const env = isStaging ? NodeEnv.Staging : isProd ? NodeEnv.Prod : NodeEnv.Dev;
export const useS3 = Boolean(process.env['AWS_REGION'] && process.env['AWS_BUCKET_NAME']);
export const integrationFilesAreRemote = isEnterprise && useS3;
//# sourceMappingURL=detection.js.map