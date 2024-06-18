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
import yaml from 'js-yaml';
import { isJsOrTsType, SyncConfigType, nangoConfigFile } from '@nangohq/shared';
import path from 'path';
import { printDebug } from '../utils.js';
import configService from './config.service.js';
class ModelService {
    build(models, integrations, debug = false) {
        const returnedModels = Object.keys(integrations).reduce((acc, providerConfigKey) => {
            const syncObject = integrations[providerConfigKey];
            const syncNames = Object.keys(syncObject);
            for (const syncName of syncNames) {
                const syncData = syncObject[syncName];
                if (syncData.returns) {
                    const syncReturns = Array.isArray(syncData.returns) ? syncData.returns : [syncData.returns];
                    syncReturns.forEach((modelName) => {
                        if (!acc.includes(modelName)) {
                            acc.push(modelName);
                        }
                    });
                }
            }
            return acc;
        }, []);
        if (!models) {
            return null;
        }
        const interfaceDefinitions = Object.keys(models).map((modelName) => {
            const fields = models[modelName];
            // we only care that models that are returned have an ID field
            // if the model is not returned from a sync script then it must be a
            // helper model that is used to build the returned models
            const syncForModel = Object.keys(integrations).find((providerConfigKey) => {
                const syncObject = integrations[providerConfigKey];
                const syncNames = Object.keys(syncObject);
                for (const syncName of syncNames) {
                    const syncData = syncObject[syncName];
                    if (syncData.returns && syncData.type !== SyncConfigType.ACTION) {
                        return syncData.returns.includes(modelName);
                    }
                }
                return false;
            });
            if (returnedModels.includes(modelName) && !fields['id'] && syncForModel) {
                throw new Error(`Model "${modelName}" doesn't have an id field. This is required to be able to uniquely identify the data record.`);
            }
            const interfaceName = `${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}`;
            let extendsClause = '';
            const fieldDefinitions = Object.keys(fields)
                .filter((fieldName) => {
                if (fieldName === '__extends') {
                    const fieldModel = fields[fieldName];
                    const multipleExtends = fieldModel.split(',').map((e) => e.trim());
                    extendsClause = ` extends ${multipleExtends.join(', ')}`;
                    return false;
                }
                return true;
            })
                .map((fieldName) => {
                const fieldModel = fields[fieldName];
                const fieldType = this.getFieldType(fieldModel, debug, modelName, models);
                if (fieldName === '__string') {
                    const dynamicName = fields[fieldName];
                    return ` [key: string]: ${dynamicName};`;
                }
                return `  ${fieldName}: ${fieldType};`;
            })
                .join('\n');
            const interfaceDefinition = `export interface ${interfaceName}${extendsClause} {\n${fieldDefinitions}\n}\n`;
            return interfaceDefinition;
        });
        printDebug(`Generated interface definitions: ${interfaceDefinitions.join('\n')}`);
        return interfaceDefinitions;
    }
    getFieldType(rawField, debug = false, modelName, models) {
        if (typeof rawField === 'string') {
            if (rawField.toString().endsWith(',') || rawField.toString().endsWith(';')) {
                throw new Error(`Field "${rawField}" in the model ${modelName} ends with a comma or semicolon which is not allowed.`);
            }
            let field = rawField;
            let hasNull = false;
            let hasUndefined = false;
            let tsType = '';
            if (field.includes('null')) {
                field = field.replace(/\s*\|\s*null\s*/g, '');
                hasNull = true;
            }
            if (field === 'undefined') {
                if (debug) {
                    printDebug(`Field is defined undefined which isn't recommended.`);
                }
                return 'undefined';
            }
            if (field.includes('undefined')) {
                field = field.replace(/\s*\|\s*undefined\s*/g, '');
                hasUndefined = true;
            }
            switch (field) {
                case 'boolean':
                case 'bool':
                    tsType = 'boolean';
                    break;
                case 'string':
                    tsType = 'string';
                    break;
                case 'char':
                    tsType = 'string';
                    break;
                case 'integer':
                case 'int':
                case 'number':
                    tsType = 'number';
                    break;
                case 'date':
                    tsType = 'Date';
                    break;
                default:
                    tsType = field;
            }
            if (hasNull) {
                tsType = `${tsType} | null`;
            }
            if (hasUndefined) {
                tsType = `${tsType} | undefined`;
            }
            if (tsType.includes('|')) {
                const types = tsType.split('|');
                const hasStringLiteral = types.some((type) => !isJsOrTsType(type.trim()) && !Object.keys(models).includes(type.replace(/\[\]/g, '').trim()));
                if (hasStringLiteral) {
                    const enumValues = tsType
                        .split('|')
                        .map((e) => (isJsOrTsType(e.trim()) || Object.keys(models).includes(e.trim()) ? e.trim() : `'${e.trim()}'`))
                        .join(' | ');
                    tsType = enumValues;
                }
            }
            return tsType;
        }
        else {
            try {
                const nestedFields = rawField && typeof rawField === 'object'
                    ? Object.keys(rawField)
                        .map((fieldName) => {
                        const field = rawField[fieldName];
                        if (typeof field === 'string' || typeof field === 'object') {
                            return `  ${fieldName}: ${this.getFieldType(field, debug, modelName, models)};`;
                        }
                        return `  ${fieldName}: ${String(field)};`;
                    })
                        .join('\n')
                    : '';
                return `{\n${nestedFields}\n}`;
            }
            catch (_) {
                return String(rawField);
            }
        }
    }
    createModelFile({ fullPath }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                printDebug(`Starting createModelFile with fullPath: ${fullPath}`);
                const configContents = yield fs.promises.readFile(path.join(fullPath, nangoConfigFile), 'utf8');
                printDebug(`Read configContents: ${configContents}`);
                const configData = yaml.load(configContents);
                printDebug(`Parsed configData: ${JSON.stringify(configData, null, 2)}`);
                const { models, integrations } = configData;
                const interfaceDefinitions = modelService.build(models, integrations);
                const typesFilePath = path.join(fullPath, 'dist', 'nango-sync.d.ts');
                if (interfaceDefinitions) {
                    printDebug(`Generated interfaceDefinitions: ${interfaceDefinitions.join('\n')}`);
                    printDebug(`Writing interface definitions to ${typesFilePath}`);
                    yield fs.promises.writeFile(typesFilePath, interfaceDefinitions.join('\n'));
                    printDebug(`Contents of ${typesFilePath} immediately after writing interface definitions: ${yield fs.promises.readFile(typesFilePath, 'utf8')}`);
                }
                else {
                    printDebug('No interface definitions were generated.');
                }
                const { success, response: config } = yield configService.load(fullPath);
                printDebug(`Loaded config: ${JSON.stringify(config, null, 2)}`);
                if (!success || !config) {
                    printDebug('Failed to load config');
                    throw new Error('Failed to load config');
                }
                const flowConfig = `export const NangoFlows = ${JSON.stringify(config, null, 2)} as const; \n`;
                printDebug(`Appending flow config to ${typesFilePath}`);
                yield fs.promises.appendFile(typesFilePath, flowConfig);
                printDebug(`Contents of ${typesFilePath} immediately after appending flow config: ${yield fs.promises.readFile(typesFilePath, 'utf8')}`);
                printDebug(`Completed createModelFile for fullPath: ${fullPath}`);
            }
            catch (error) {
                const err = error;
                printDebug(`Error in createModelFile: ${err.message}`);
                throw err;
            }
        });
    }
}
const modelService = new ModelService();
export default modelService;
//# sourceMappingURL=model.service.js.map