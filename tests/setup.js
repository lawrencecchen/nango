var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { randomUUID } from 'crypto';
import { Wait, PostgreSqlContainer, ElasticsearchContainer } from 'testcontainers';
const containers = [];
export function setupElasticsearch() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting Elasticsearch...');
        const es = yield new ElasticsearchContainer('elasticsearch:8.13.0')
            .withName(`es-test-${randomUUID()}`)
            .withEnvironment({
            'discovery.type': 'single-node',
            'xpack.security.enabled': 'false'
        })
            .withStartupTimeout(120000)
            .withExposedPorts(9200)
            .start();
        containers.push(es);
        const url = `http://${es.getHost()}:${es.getMappedPort(9200)}`;
        process.env['NANGO_LOGS_ES_URL'] = url;
        process.env['NANGO_LOGS_ES_USER'] = '';
        process.env['NANGO_LOGS_ES_PWD'] = '';
        process.env['NANGO_LOGS_ENABLED'] = 'true';
        console.log('ES running at', url);
    });
}
function setupPostgres() {
    return __awaiter(this, void 0, void 0, function* () {
        const dbName = 'postgres';
        const user = 'postgres';
        const password = 'nango_test';
        const container = new PostgreSqlContainer('postgres:15.5-alpine');
        const pg = yield container
            .withDatabase(dbName)
            .withUsername(user)
            .withPassword(password)
            .withExposedPorts(5432)
            .withName(`pg-test-${randomUUID()}`)
            .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
            .start();
        containers.push(pg);
        const port = pg.getMappedPort(5432);
        process.env['NANGO_DB_PASSWORD'] = password;
        process.env['NANGO_DB_HOST'] = 'localhost';
        process.env['NANGO_DB_USER'] = user;
        process.env['NANGO_DB_PORT'] = port.toString();
        process.env['NANGO_DB_NAME'] = dbName;
        process.env['NANGO_DB_MIGRATION_FOLDER'] = './packages/database/lib/migrations';
        process.env['TELEMETRY'] = 'false';
        process.env['RECORDS_DATABASE_URL'] = `postgres://${user}:${password}@localhost:${port}/${dbName}`;
    });
}
export function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([setupPostgres(), setupElasticsearch()]);
    });
}
export const teardown = () => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all(containers.map((container) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield container.stop();
        }
        catch (err) {
            console.error(err);
        }
    })));
});
//# sourceMappingURL=setup.js.map