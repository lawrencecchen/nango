var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BigQuery } from '@google-cloud/bigquery';
import { getLogger, isCloud } from '@nangohq/utils';
const logger = getLogger('BigQueryClient');
class BigQueryClient {
    constructor({ datasetName, tableName }) {
        this.client = new BigQuery();
        this.tableName = tableName;
        this.datasetName = datasetName;
    }
    static createInstance({ datasetName, tableName }) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new BigQueryClient({
                datasetName: datasetName || 'raw',
                tableName
            });
            yield instance.initialize();
            return instance;
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (isCloud) {
                    yield this.createDataSet();
                    yield this.createTable();
                }
            }
            catch (e) {
                logger.error('Error initializing', e);
            }
        });
    }
    createDataSet() {
        return __awaiter(this, void 0, void 0, function* () {
            const dataset = this.client.dataset(this.datasetName);
            const [exists] = yield dataset.exists();
            if (!exists) {
                yield this.client.createDataset(this.datasetName);
            }
        });
    }
    createTable() {
        return __awaiter(this, void 0, void 0, function* () {
            const table = this.client.dataset(this.datasetName).table(this.tableName);
            const [exists] = yield table.exists();
            if (!exists) {
                yield table.create({
                    schema: {
                        fields: [
                            { name: 'executionType', type: 'STRING' },
                            { name: 'internalConnectionId', type: 'INTEGER' },
                            { name: 'connectionId', type: 'STRING' },
                            { name: 'accountId', type: 'INTEGER' },
                            { name: 'accountName', type: 'STRING' },
                            { name: 'scriptName', type: 'STRING' },
                            { name: 'scriptType', type: 'STRING' },
                            { name: 'environmentId', type: 'INTEGER' },
                            { name: 'environmentName', type: 'STRING' },
                            { name: 'providerConfigKey', type: 'STRING' },
                            { name: 'status', type: 'STRING' },
                            { name: 'syncId', type: 'STRING' },
                            { name: 'content', type: 'STRING' },
                            { name: 'runTimeInSeconds', type: 'FLOAT' },
                            { name: 'createdAt', type: 'INTEGER' }
                        ]
                    }
                });
            }
        });
    }
    insert(data, tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableName || this.tableName;
            try {
                if (isCloud) {
                    yield this.client.dataset(this.datasetName).table(table).insert(data);
                }
            }
            catch (e) {
                logger.error('Error inserting into BigQuery', e);
            }
        });
    }
}
export { BigQueryClient };
//# sourceMappingURL=index.js.map