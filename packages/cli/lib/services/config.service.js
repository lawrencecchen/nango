var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import Ajv from 'ajv';
import addErrors from 'ajv-errors';
import chalk from 'chalk';
import { loadLocalNangoConfig, loadStandardConfig, nangoConfigFile, determineVersion, NangoError } from '@nangohq/shared';
import { getNangoRootPath, printDebug } from '../utils.js';
class ConfigService {
    load(fullPath, debug = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const localConfig = yield loadLocalNangoConfig(fullPath);
            if (!localConfig) {
                return { success: false, error: new NangoError('error_loading_nango_config'), response: null };
            }
            const { success: validationSuccess, error: validationError } = this.validate(localConfig);
            if (!validationSuccess) {
                return { success: false, error: validationError, response: null };
            }
            const { success, error, response: config } = loadStandardConfig(localConfig, true);
            if (!success || !config) {
                return { success: false, error, response: null };
            }
            if (debug) {
                printDebug(`Config file found`);
            }
            return { success: true, error: null, response: config };
        });
    }
    getModelNames(config) {
        const modelNames = config.reduce((acc, config) => {
            const syncs = config.syncs || [];
            const actions = config.actions || [];
            const allSyncs = [...syncs, ...actions];
            const models = allSyncs.reduce((acc, sync) => {
                const models = sync.models || [];
                const names = models.map((model) => model.name);
                return [...acc, ...names];
            }, []);
            return [...acc, ...models];
        }, []);
        return modelNames;
    }
    validate(config) {
        var _a, _b;
        const ajv = new Ajv({ allErrors: true });
        addErrors(ajv);
        if (!config || !config.integrations) {
            return { success: true, error: null, response: null };
        }
        if (config.integrations['syncs'] || config.integrations['actions']) {
            const error = new NangoError('pass_through_error', `The ${nangoConfigFile} file has an invalid format, syncs or actions should be nested under a provider config key.`);
            return { success: false, error, response: null };
        }
        const version = determineVersion(config);
        const validationFile = version === 'v1' ? 'nango.yaml.schema.v1.json' : 'nango.yaml.schema.v2.json';
        const schema = fs.readFileSync(`${getNangoRootPath()}/lib/${validationFile}`, 'utf8');
        const validate = ajv.compile(JSON.parse(schema));
        if (!validate(config)) {
            const validationMessageStart = 'nango yaml schema validation error:;';
            let messages = (_a = validate.errors) === null || _a === void 0 ? void 0 : _a.filter((error) => { var _a; return (_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes(validationMessageStart); }).map((error) => error.message).join('\n');
            if ((messages === null || messages === void 0 ? void 0 : messages.length) === 0) {
                messages = (_b = validate.errors) === null || _b === void 0 ? void 0 : _b.map((error) => error.message).join('\n');
            }
            console.log(chalk.red(`yaml validation failed with: ${messages}`));
            const error = new NangoError('pass_through_error', `Problem validating the ${nangoConfigFile} file.`);
            return { success: false, error, response: null };
        }
        return { success: true, error: null, response: null };
    }
}
const configService = new ConfigService();
export default configService;
//# sourceMappingURL=config.service.js.map