import { envs } from '../env.js';
export const schema = envs.RECORDS_DATABASE_SCHEMA;
const runningMigrationOnly = process.argv.some((v) => v === 'migrate:latest');
const isJS = !runningMigrationOnly;
const config = {
    client: 'postgres',
    connection: {
        connectionString: envs.RECORDS_DATABASE_URL,
        statement_timeout: 60000
    },
    searchPath: schema,
    pool: { min: 2, max: 50 },
    migrations: {
        extension: isJS ? 'js' : 'ts',
        directory: 'migrations',
        tableName: 'migrations',
        loadExtensions: [isJS ? '.js' : '.ts'],
        schemaName: schema
    }
};
export { config };
//# sourceMappingURL=config.js.map