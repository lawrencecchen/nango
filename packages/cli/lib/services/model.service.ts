import fs from 'fs';
import yaml from 'js-yaml';
import type { NangoConfig, NangoModel, NangoIntegration, NangoIntegrationData } from '@nangohq/shared';
import { isJsOrTsType, SyncConfigType, nangoConfigFile } from '@nangohq/shared';
import { printDebug } from '../utils.js';
import { TYPES_FILE_NAME } from '../constants.js';
import configService from './config.service.js';
import path from 'path';

class ModelService {
    public build(models: NangoModel, integrations: NangoIntegration, debug = false): (string | undefined)[] | null {
        const returnedModels = Object.keys(integrations).reduce<string[]>((acc, providerConfigKey) => {
            const syncObject = integrations[providerConfigKey] as unknown as Record<string, NangoIntegration>;
            const syncNames = Object.keys(syncObject);
            for (const syncName of syncNames) {
                const syncData = syncObject[syncName] as unknown as NangoIntegrationData;
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

        const interfaceDefinitions = Object.keys(models).map((modelName: string) => {
            const fields = models[modelName] as NangoModel;

            // we only care that models that are returned have an ID field
            // if the model is not returned from a sync script then it must be a
            // helper model that is used to build the returned models
            const syncForModel = Object.keys(integrations).find((providerConfigKey) => {
                const syncObject = integrations[providerConfigKey] as unknown as Record<string, NangoIntegration>;
                const syncNames = Object.keys(syncObject);
                for (const syncName of syncNames) {
                    const syncData = syncObject[syncName] as unknown as NangoIntegrationData;
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
                .filter((fieldName: string) => {
                    if (fieldName === '__extends') {
                        const fieldModel = fields[fieldName] as unknown as string;
                        const multipleExtends = fieldModel.split(',').map((e) => e.trim());
                        extendsClause = ` extends ${multipleExtends.join(', ')}`;
                        return false;
                    }
                    return true;
                })
                .map((fieldName: string) => {
                    const fieldModel = fields[fieldName] as string | NangoModel;
                    const fieldType = this.getFieldType(fieldModel, debug, modelName, models);
                    if (fieldName === '__string') {
                        const dynamicName = fields[fieldName] as unknown as string;
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

    private getFieldType(rawField: string | NangoModel, debug = false, modelName: string, models: NangoModel): string {
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
        } else {
            try {
                const nestedFields =
                    rawField && typeof rawField === 'object'
                        ? Object.keys(rawField)
                              .map((fieldName: string) => {
                                  const field = rawField[fieldName];
                                  if (typeof field === 'string' || typeof field === 'object') {
                                      return `  ${fieldName}: ${this.getFieldType(field as string | NangoModel, debug, modelName, models)};`;
                                  }
                                  return `  ${fieldName}: ${String(field)};`;
                              })
                              .join('\n')
                        : '';
                return `{\n${nestedFields}\n}`;
            } catch (_) {
                return String(rawField);
            }
        }
    }

    public async createModelFile({ fullPath }: { fullPath: string }) {
        try {
            const configContents = await fs.promises.readFile(path.join(fullPath, nangoConfigFile), 'utf8');
            const configData: NangoConfig = yaml.load(configContents) as NangoConfig;
            const { models, integrations } = configData;
            const interfaceDefinitions = modelService.build(models, integrations);

            if (interfaceDefinitions) {
                await fs.promises.writeFile(path.join(fullPath, TYPES_FILE_NAME), interfaceDefinitions.join('\n'));
                printDebug(
                    `Contents of ${TYPES_FILE_NAME} after writing interface definitions: ${await fs.promises.readFile(path.join(fullPath, TYPES_FILE_NAME), 'utf8')}`
                );
            }

            const { success, response: config } = await configService.load(fullPath);

            if (!success || !config) {
                printDebug('Failed to load config');
                throw new Error('Failed to load config');
            }

            const flowConfig = `export const NangoFlows = ${JSON.stringify(config, null, 2)} as const; \n`;
            await fs.promises.appendFile(path.join(fullPath, TYPES_FILE_NAME), flowConfig);
            printDebug(
                `Contents of ${TYPES_FILE_NAME} after appending flow config: ${await fs.promises.readFile(path.join(fullPath, TYPES_FILE_NAME), 'utf8')}`
            );
        } catch (error) {
            const err = error as Error;
            printDebug(`Error in createModelFile: ${err.message}`);
            throw err;
        }
    }
}

const modelService = new ModelService();
export default modelService;
