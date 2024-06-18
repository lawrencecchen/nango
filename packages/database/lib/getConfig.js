export const defaultSchema = process.env['NANGO_DB_SCHEMA'] || 'nango';
const additionalSchemas = process.env['NANGO_DB_ADDITIONAL_SCHEMAS']
    ? process.env['NANGO_DB_ADDITIONAL_SCHEMAS'].split(',').map((schema) => schema.trim())
    : [];
export function getDbConfig({ timeoutMs }) {
    return {
        client: process.env['NANGO_DB_CLIENT'] || 'pg',
        connection: process.env['NANGO_DATABASE_URL'] || {
            host: process.env['NANGO_DB_HOST'] || (process.env['SERVER_RUN_MODE'] === 'DOCKERIZED' ? 'nango-db' : 'localhost'),
            port: +(process.env['NANGO_DB_PORT'] || 5432),
            user: process.env['NANGO_DB_USER'] || 'nango',
            database: process.env['NANGO_DB_NAME'] || 'nango',
            password: process.env['NANGO_DB_PASSWORD'] || 'nango',
            ssl: process.env['NANGO_DB_SSL'] != null && process.env['NANGO_DB_SSL'].toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined,
            statement_timeout: timeoutMs
        },
        pool: {
            min: parseInt(process.env['NANGO_DB_POOL_MIN'] || '2'),
            max: parseInt(process.env['NANGO_DB_POOL_MAX'] || '50')
        },
        // SearchPath needs the current db and public because extension can only be installed once per DB
        searchPath: [defaultSchema, 'public', ...additionalSchemas]
    };
}
//# sourceMappingURL=getConfig.js.map