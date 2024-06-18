var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { SyncConfigType } from '@nangohq/shared';
import { init, generate } from './cli.js';
import { exampleSyncName } from './constants.js';
import configService from './services/config.service.js';
import { compileAllFiles, compileSingleFile, getFileToCompile } from './services/compile.service.js';
import { getNangoRootPath, printDebug } from './utils.js';
import parserService from './services/parser.service.js';
import { copyDirectoryAndContents } from './tests/helpers.js';
import modelService from './services/model.service.js';
function getTestDirectory(name) {
    const dir = `/tmp/${name}/nango-integrations/`;
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}
describe('generate function tests', () => {
    const fixturesPath = './packages/cli/fixtures';
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const fullPath = path.resolve('./packages/cli');
        yield modelService.createModelFile({ fullPath });
        const typesFilePath = path.join(fullPath, 'dist', 'nango-sync.d.ts');
        const typesContent = yield fs.promises.readFile(typesFilePath, 'utf8');
        printDebug(`Contents of ${typesFilePath} in beforeAll hook: ${typesContent}`);
        expect(typesContent).not.toBe('');
    }));
    it('should init the expected files in the nango-integrations directory', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('init');
        yield init({ absolutePath: path.resolve(dir, '..'), debug: false });
        expect(fs.existsSync(`${dir}/demo-github-integration/syncs/${exampleSyncName}.ts`)).toBe(true);
        expect(fs.existsSync(`${dir}/.env`)).toBe(true);
        expect(fs.existsSync(`${dir}/nango.yaml`)).toBe(true);
    }));
    it('should not overwrite existing integration files', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('overwrite');
        yield init({ absolutePath: dir, debug: false });
        yield fs.promises.writeFile(`${dir}/${exampleSyncName}.ts`, 'dummy fake content', 'utf8');
        const dummyContent = 'This is dummy content. Do not overwrite!';
        const exampleFilePath = path.join(dir, `${exampleSyncName}.ts`);
        yield fs.promises.writeFile(exampleFilePath, dummyContent, 'utf8');
        yield init({ absolutePath: dir });
        expect(fs.existsSync(exampleFilePath)).toBe(true);
        const fileContentAfterInit = yield fs.promises.readFile(exampleFilePath, 'utf8');
        expect(fileContentAfterInit).toBe(dummyContent);
    }));
    it('should generate a different sync correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('generate');
        yield init({ absolutePath: path.resolve(dir, '..') });
        const data = {
            integrations: {
                'demo-github-integration': {
                    'some-other-sync': {
                        type: 'sync',
                        runs: 'every half hour',
                        returns: ['GithubIssue']
                    }
                }
            },
            models: {
                GithubIssue: {
                    id: 'integer',
                    owner: 'string',
                    repo: 'string',
                    issue_number: 'number',
                    title: 'string',
                    author: 'string',
                    author_id: 'string',
                    state: 'string',
                    date_created: 'date',
                    date_last_modified: 'date',
                    body: 'string'
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        yield generate({ debug: false, fullPath: dir });
        const typesFilePath = path.join(dir, 'dist', 'nango-sync.d.ts');
        const typesContent = yield fs.promises.readFile(typesFilePath, 'utf8');
        printDebug(`Contents of ${typesFilePath} after generate call: ${typesContent}`);
        expect(typesContent).not.toBe('');
    }));
    it('should support a single model return in v1 format', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('single-model-v1');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    'single-model-return': {
                        type: 'sync',
                        runs: 'every half hour',
                        returns: 'GithubIssue'
                    }
                }
            },
            models: {
                GithubIssue: {
                    id: 'integer',
                    owner: 'string',
                    repo: 'string',
                    issue_number: 'number',
                    title: 'string',
                    author: 'string',
                    author_id: 'string',
                    state: 'string',
                    date_created: 'date',
                    date_last_modified: 'date',
                    body: 'string'
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        yield generate({ debug: false, fullPath: dir });
        expect(fs.existsSync(`${dir}/single-model-return.ts`)).toBe(true);
    }));
    it('should support a single model return in v2 format', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('single-model-v2');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    syncs: {
                        'single-model-return': {
                            runs: 'every half hour',
                            endpoint: 'GET /issues',
                            output: 'GithubIssue'
                        }
                    }
                }
            },
            models: {
                GithubIssue: {
                    id: 'integer',
                    owner: 'string',
                    repo: 'string',
                    issue_number: 'number',
                    title: 'string',
                    author: 'string',
                    author_id: 'string',
                    state: 'string',
                    date_created: 'date',
                    date_last_modified: 'date',
                    body: 'string'
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        yield generate({ debug: false, fullPath: dir });
        expect(fs.existsSync(`${dir}/demo-github-integration/syncs/single-model-return.ts`)).toBe(true);
    }));
    it('should not create a file if endpoint is missing from a v2 config', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('endpoint-missing-v2');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    syncs: {
                        'single-model-return': {
                            type: 'sync',
                            runs: 'every half hour',
                            returns: 'GithubIssue'
                        }
                    }
                }
            },
            models: {
                GithubIssue: {
                    id: 'integer',
                    owner: 'string',
                    repo: 'string',
                    issue_number: 'number',
                    title: 'string',
                    author: 'string',
                    author_id: 'string',
                    state: 'string',
                    date_created: 'date',
                    date_last_modified: 'date',
                    body: 'string'
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        expect(fs.existsSync(`${dir}/demo-github-integration/syncs/single-model-return.ts`)).toBe(false);
    }));
    it('should generate missing from a v2 config', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('v2-incremental-compile');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    syncs: {
                        'single-model-issue-output': {
                            runs: 'every half hour',
                            endpoint: 'GET /tickets/issue',
                            output: 'GithubIssue'
                        }
                    }
                }
            },
            models: {
                GithubIssue: {
                    id: 'integer',
                    owner: 'string',
                    repo: 'string',
                    issue_number: 'number',
                    title: 'string',
                    author: 'string',
                    author_id: 'string',
                    state: 'string',
                    date_created: 'date',
                    date_last_modified: 'date',
                    body: 'string'
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        yield generate({ debug: false, fullPath: dir });
        expect(fs.existsSync(`${dir}/demo-github-integration/syncs/single-model-issue-output.ts`)).toBe(true);
    }));
    it('should throw an error if a model is missing an id that is actively used', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('missing-id');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    'single-model-return': {
                        type: 'sync',
                        runs: 'every half hour',
                        returns: 'GithubIssue'
                    }
                }
            },
            models: {
                GithubIssue: {
                    owner: 'string',
                    repo: 'string',
                    issue_number: 'number',
                    title: 'string',
                    author: 'string',
                    author_id: 'string',
                    state: 'string',
                    date_created: 'date',
                    date_last_modified: 'date',
                    body: 'string'
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        yield expect(generate({ debug: false, fullPath: dir })).rejects.toThrow(`Model "GithubIssue" doesn't have an id field. This is required to be able to uniquely identify the data record.`);
    }));
    it('should allow models to end with an "s"', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('model-with-an-s');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    'single-model-return': {
                        type: 'sync',
                        runs: 'every half hour',
                        returns: 'GithubIssues'
                    }
                }
            },
            models: {
                GithubIssues: {
                    id: 'string',
                    owner: 'string',
                    repo: 'string',
                    issue_number: 'number',
                    title: 'string',
                    author: 'string',
                    author_id: 'string',
                    state: 'string',
                    date_created: 'date',
                    date_last_modified: 'date',
                    body: 'string'
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        yield generate({ debug: false, fullPath: dir });
        const modelsFile = yield fs.promises.readFile(`${dir}/models.ts`, 'utf8');
        expect(modelsFile).toContain('export interface GithubIssues');
    }));
    it('should not throw an error if a model is missing an id for an action', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('missing-id-action');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    'single-model-return': {
                        type: 'action',
                        returns: 'GithubIssue'
                    }
                }
            },
            models: {
                GithubIssue: {
                    owner: 'string',
                    repo: 'string',
                    issue_number: 'number',
                    title: 'string',
                    author: 'string',
                    author_id: 'string',
                    state: 'string',
                    date_created: 'date',
                    date_last_modified: 'date',
                    body: 'string'
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        yield generate({ debug: false, fullPath: dir });
    }));
    it('should allow javascript primitives as a return type with no model', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('model-returns-primitives');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    'single-model-return': {
                        type: 'sync',
                        returns: 'string'
                    },
                    'single-model-return-action': {
                        type: 'action',
                        returns: 'string'
                    }
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        yield generate({ debug: false, fullPath: dir });
    }));
    it('should catch non javascript primitives in the config', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('model-returns-invalid-primitives');
        yield init({ absolutePath: dir });
        const data = {
            integrations: {
                'demo-github-integration': {
                    'single-model-return': {
                        type: 'sync',
                        returns: 'string'
                    },
                    'single-model-return-action': {
                        type: 'action',
                        returns: 'strings'
                    }
                }
            }
        };
        const yamlData = yaml.dump(data, {});
        yield fs.promises.writeFile(`${dir}/nango.yaml`, yamlData, 'utf8');
        expect(yield generate({ debug: false, fullPath: dir })).toBeUndefined();
    }));
    it('should not complain of try catch not being awaited', () => {
        const awaiting = parserService.callsAreUsedCorrectly(`${fixturesPath}/sync.ts`, SyncConfigType.SYNC, ['GithubIssue']);
        expect(awaiting).toBe(true);
    });
    it('should complain when a return statement is used', () => {
        const noReturnUsed = parserService.callsAreUsedCorrectly(`${fixturesPath}/return-sync.ts`, SyncConfigType.SYNC, ['GithubIssue']);
        expect(noReturnUsed).toBe(false);
    });
    it('should not complain when a return statement is used but does not return anything', () => {
        const noReturnUsed = parserService.callsAreUsedCorrectly(`${fixturesPath}/void-return-sync.ts`, SyncConfigType.SYNC, ['GithubIssue']);
        expect(noReturnUsed).toBe(true);
    });
    it('should not complain when a return statement is used in a nested function', () => {
        const noReturnUsed = parserService.callsAreUsedCorrectly(`${fixturesPath}/nested-return-sync.ts`, SyncConfigType.SYNC, ['GreenhouseEeoc']);
        expect(noReturnUsed).toBe(true);
    });
    it('should complain of a non try catch not being awaited', () => {
        const awaiting = parserService.callsAreUsedCorrectly(`${fixturesPath}/failing-sync.ts`, SyncConfigType.SYNC, ['GithubIssue']);
        expect(awaiting).toBe(false);
    });
    it('should not complain about a correct model', () => {
        const usedCorrectly = parserService.callsAreUsedCorrectly(`${fixturesPath}/bad-model.ts`, SyncConfigType.SYNC, ['SomeBadModel']);
        expect(usedCorrectly).toBe(true);
    });
    it('should not complain about awaiting when it is returned for an action', () => {
        const awaiting = parserService.callsAreUsedCorrectly(`${fixturesPath}/no-async-return.ts`, SyncConfigType.ACTION, ['SomeModel']);
        expect(awaiting).toBe(true);
    });
    it('should complain about an incorrect model', () => {
        const awaiting = parserService.callsAreUsedCorrectly(`${fixturesPath}/bad-model.ts`, SyncConfigType.SYNC, ['GithubIssue']);
        expect(awaiting).toBe(false);
    });
    it('should complain if retryOn is used without retries', () => {
        const usedCorrectly = parserService.callsAreUsedCorrectly(`${fixturesPath}/retry-on-bad.ts`, SyncConfigType.SYNC, ['GithubIssue']);
        expect(usedCorrectly).toBe(false);
    });
    it('should not complain if retryOn is used with retries', () => {
        const usedCorrectly = parserService.callsAreUsedCorrectly(`${fixturesPath}/retry-on-good.ts`, SyncConfigType.SYNC, ['GithubIssue']);
        expect(usedCorrectly).toBe(false);
    });
    it('should parse a nango.yaml file that is version 1 as expected', () => __awaiter(void 0, void 0, void 0, function* () {
        const { response: config } = yield configService.load(path.resolve(__dirname, `../fixtures/nango-yaml/v1/valid`));
        expect(config).toBeDefined();
        expect(config).toMatchSnapshot();
    }));
    it('v1 - should complain about commas at the end of declared types', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('v1-no-commas');
        yield init({ absolutePath: dir });
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v1/no-commas/nango.yaml`, `${dir}/nango.yaml`);
        yield expect(generate({ debug: false, fullPath: dir })).rejects.toThrow(`Field "integer," in the model GithubIssue ends with a comma or semicolon which is not allowed.`);
    }));
    it('v1 - should complain about semi colons at the end of declared types', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('v1-no-semi-colons');
        yield init({ absolutePath: dir });
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v1/no-semi-colons/nango.yaml`, `${dir}/nango.yaml`);
        yield expect(generate({ debug: false, fullPath: dir })).rejects.toThrow(`Field "integer;" in the model GithubIssue ends with a comma or semicolon which is not allowed.`);
    }));
    it('should parse a nango.yaml file that is version 2 as expected', () => __awaiter(void 0, void 0, void 0, function* () {
        const { response: config } = yield configService.load(path.resolve(__dirname, `../fixtures/nango-yaml/v2/valid`));
        expect(config).toBeDefined();
        expect(config).toMatchSnapshot();
    }));
    it('should throw a validation error on a nango.yaml file that is not formatted correctly -- missing endpoint', () => __awaiter(void 0, void 0, void 0, function* () {
        const { response: config, error } = yield configService.load(path.resolve(__dirname, `../fixtures/nango-yaml/v2/invalid.1`));
        expect(config).toBeNull();
        expect(error).toBeDefined();
        expect(error === null || error === void 0 ? void 0 : error.message).toMatchSnapshot();
    }));
    it('should throw a validation error on a nango.yaml file that is not formatted correctly -- webhook subscriptions are not allowed in an action', () => __awaiter(void 0, void 0, void 0, function* () {
        const { response: config, error } = yield configService.load(path.resolve(__dirname, `../fixtures/nango-yaml/v2/invalid.2`));
        expect(config).toBeNull();
        expect(error).toBeDefined();
        expect(error === null || error === void 0 ? void 0 : error.message).toEqual('Problem validating the nango.yaml file.');
    }));
    it('should correctly interpret a string union literal type', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('validation-string-union');
        yield init({ absolutePath: dir });
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/string-literal/nango.yaml`, `${dir}/nango.yaml`);
        yield generate({ debug: false, fullPath: dir });
        const typesFilePath = path.join(dir, 'dist', 'nango-sync.d.ts');
        const typesContent = yield fs.promises.readFile(typesFilePath, 'utf8');
        expect(typesContent).not.toBe('');
    }));
    it('should correctly interpret a union literal type with a string and a primitive', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('validation-string-primitve');
        yield init({ absolutePath: dir });
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/mixed-literal/nango.yaml`, `${dir}/nango.yaml`);
        yield generate({ debug: false, fullPath: dir });
        const typesFilePath = path.join(dir, 'dist', 'nango-sync.d.ts');
        const typesContent = yield fs.promises.readFile(typesFilePath, 'utf8');
        expect(typesContent).not.toBe('');
    }));
    it('should correctly interpret a union literal type with a string and a model', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('validation-string-model');
        yield init({ absolutePath: dir });
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/mixed-literal-model/nango.yaml`, `${dir}/nango.yaml`);
        yield generate({ debug: false, fullPath: dir });
        const typesFilePath = path.join(dir, 'dist', 'nango-sync.d.ts');
        const typesContent = yield fs.promises.readFile(typesFilePath, 'utf8');
        expect(typesContent).not.toBe('');
        expect(true).toBe(true);
        const modelsFile = yield fs.promises.readFile(`${dir}/models.ts`, 'utf8');
        expect(modelsFile).toContain(`gender: 'male' | Other`);
    }));
    it('should correctly interpret a union types, array types, and record types', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('validation-array-records');
        yield init({ absolutePath: dir });
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/mixed-types/nango.yaml`, `${dir}/nango.yaml`);
        yield generate({ debug: false, fullPath: dir });
        const typesFilePath = path.join(dir, 'dist', 'nango-sync.d.ts');
        const typesContent = yield fs.promises.readFile(typesFilePath, 'utf8');
        expect(typesContent).not.toBe('');
        const modelsFile = yield fs.promises.readFile(`${dir}/models.ts`, 'utf8');
        expect(modelsFile).toContain(`record: Record<string, string>;`);
        expect(modelsFile).toContain(`und: string | null | undefined;`);
        expect(modelsFile).toContain(`def: 'male' | string | null | undefined;`);
        expect(modelsFile).toContain(`reference: Other[];`);
        expect(modelsFile).toContain(`nullableDate: Date | null;`);
    }));
    it('should correctly interpret a union type with an array model', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('validation-array-model');
        yield init({ absolutePath: dir });
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/model-array-types/nango.yaml`, `${dir}/nango.yaml`);
        yield generate({ debug: false, fullPath: dir });
        const typesFilePath = path.join(dir, 'dist', 'nango-sync.d.ts');
        const typesContent = yield fs.promises.readFile(typesFilePath, 'utf8');
        expect(typesContent).not.toBe('');
    }));
    it('should be able to compile files in nested directories', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('nested');
        yield init({ absolutePath: dir });
        yield copyDirectoryAndContents(`${fixturesPath}/nango-yaml/v2/nested-integrations/hubspot`, `${dir}/hubspot`);
        yield copyDirectoryAndContents(`${fixturesPath}/nango-yaml/v2/nested-integrations/github`, `${dir}/github`);
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/nested-integrations/nango.yaml`, `${dir}/nango.yaml`);
        const success = yield compileAllFiles({ fullPath: dir, debug: true });
        expect(fs.existsSync(path.join(dir, 'models.ts'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'hubspot/syncs/contacts.ts'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'dist/contacts-hubspot.js'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'dist/issues-github.js'))).toBe(true);
        expect(success).toBe(true);
    }));
    it('should be backwards compatible with the single directory for integration files', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('old-directory');
        yield init({ absolutePath: dir });
        yield copyDirectoryAndContents(`${fixturesPath}/nango-yaml/v2/non-nested-integrations`, dir);
        const success = yield compileAllFiles({ fullPath: dir, debug: false });
        expect(fs.existsSync(path.join(dir, 'models.ts'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'contacts.ts'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'dist/contacts-hubspot.js'))).toBe(true);
        expect(success).toBe(true);
    }));
    it('should be able to compile and run imported files', () => __awaiter(void 0, void 0, void 0, function* () {
        const dir = getTestDirectory('relative-imports');
        yield init({ absolutePath: dir });
        yield copyDirectoryAndContents(`${fixturesPath}/nango-yaml/v2/relative-imports/github`, `${dir}/github`);
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/relative-imports/nango.yaml`, `${dir}/nango.yaml`);
        const success = yield compileAllFiles({ fullPath: dir, debug: false });
        const module = (yield import(`${dir}dist/issues-github.js`));
        const result = module.default.default();
        expect(result).toBe('Hello, world!');
        expect(success).toBe(true);
    }));
    it('should compile helper functions and throw an error if there is a complication error with an imported file', () => __awaiter(void 0, void 0, void 0, function* () {
        const name = 'relative-imports-with-error';
        const dir = getTestDirectory('relative-imports-with-error');
        yield init({ absolutePath: dir });
        yield copyDirectoryAndContents(`${fixturesPath}/nango-yaml/v2/${name}/github`, `${dir}/github`);
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/${name}/nango.yaml`, `${dir}/nango.yaml`);
        const tsconfig = fs.readFileSync(`${getNangoRootPath()}/tsconfig.dev.json`, 'utf8');
        const { response: config } = yield configService.load(path.resolve(`${fixturesPath}/nango-yaml/v2/${name}`));
        expect(config).not.toBeNull();
        if (config) {
            const modelNames = configService.getModelNames(config);
            const result = yield compileSingleFile({
                fullPath: dir,
                file: getFileToCompile({ fullPath: dir, filePath: path.join(dir, './github/actions/gh-issues.ts') }),
                tsconfig,
                config: config,
                modelNames,
                debug: false
            });
            expect(result).toBe(false);
        }
    }));
    it('should complain if a nango call is used incorrectly in a nested file', () => __awaiter(void 0, void 0, void 0, function* () {
        const name = 'relative-imports-with-nango-misuse';
        const dir = getTestDirectory('relative-imports-with-nango-misuse');
        yield init({ absolutePath: dir });
        yield copyDirectoryAndContents(`${fixturesPath}/nango-yaml/v2/${name}/github`, `${dir}/github`);
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/${name}/nango.yaml`, `${dir}/nango.yaml`);
        const tsconfig = fs.readFileSync(`${getNangoRootPath()}/tsconfig.dev.json`, 'utf8');
        const { response: config } = yield configService.load(path.resolve(`${fixturesPath}/nango-yaml/v2/${name}`));
        expect(config).not.toBeNull();
        if (config) {
            const modelNames = configService.getModelNames(config);
            const result = yield compileSingleFile({
                fullPath: dir,
                file: getFileToCompile({ fullPath: dir, filePath: path.join(dir, './github/actions/gh-issues.ts') }),
                tsconfig,
                config: config,
                modelNames,
                debug: false
            });
            expect(result).toBe(false);
        }
    }));
    it('should not allow imports higher than the current directory', () => __awaiter(void 0, void 0, void 0, function* () {
        const name = 'relative-imports-with-higher-import';
        const dir = getTestDirectory('relative-imports-with-higher-import');
        yield init({ absolutePath: dir });
        yield copyDirectoryAndContents(`${fixturesPath}/nango-yaml/v2/${name}/github`, `${dir}/github`);
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/${name}/nango.yaml`, `${dir}/nango.yaml`);
        yield fs.promises.copyFile(`${fixturesPath}/nango-yaml/v2/${name}/github/actions/welcomer.ts`, `${dir}/welcomer.ts`);
        const tsconfig = fs.readFileSync(`${getNangoRootPath()}/tsconfig.dev.json`, 'utf8');
        const { response: config } = yield configService.load(path.resolve(`${fixturesPath}/nango-yaml/v2/${name}`));
        expect(config).not.toBeNull();
        if (config) {
            const modelNames = configService.getModelNames(config);
            const result = yield compileSingleFile({
                fullPath: dir,
                file: getFileToCompile({ fullPath: dir, filePath: path.join(dir, './github/actions/gh-issues.ts') }),
                tsconfig,
                config: config,
                modelNames,
                debug: false
            });
            expect(result).toBe(false);
        }
    }));
});
//# sourceMappingURL=sync.unit.cli-test.js.map