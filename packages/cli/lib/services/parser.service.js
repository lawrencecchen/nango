import fs from 'fs';
import chalk from 'chalk';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import parser from '@babel/parser';
import { SyncConfigType } from '@nangohq/shared';
class ParserService {
    getImportedFiles(filePath) {
        const code = fs.readFileSync(filePath, 'utf-8');
        const ast = parser.parse(code, { sourceType: 'module', plugins: ['typescript'] });
        const importedFiles = [];
        const traverseFn = traverse.default || traverse;
        traverseFn(ast, {
            ImportDeclaration(path) {
                const importPath = path.node.source.value;
                importedFiles.push(importPath);
            }
        });
        return importedFiles;
    }
    callsAreUsedCorrectly(filePath, type = SyncConfigType.SYNC, modelNames) {
        let areAwaited = true;
        let usedCorrectly = true;
        let noReturnUsed = true;
        let retryOnUsedCorrectly = true;
        const code = fs.readFileSync(filePath, 'utf-8');
        const ast = parser.parse(code, { sourceType: 'module', plugins: ['typescript'] });
        const traverseFn = traverse.default || traverse;
        const awaitMessage = (call, lineNumber) => console.log(chalk.red(`nango.${call}() calls must be awaited in "${filePath}:${lineNumber}". Not awaiting can lead to unexpected results.`));
        const disallowedMessage = (call, lineNumber) => console.log(chalk.red(`nango.${call}() calls are not allowed in an action script. Please remove it at "${filePath}:${lineNumber}".`));
        const nangoCalls = [
            'batchSend',
            'batchSave',
            'batchDelete',
            'log',
            'getFieldMapping',
            'setFieldMapping',
            'getMetadata',
            'setMetadata',
            'get',
            'post',
            'put',
            'patch',
            'delete',
            'getConnection',
            'getEnvironmentVariables',
            'triggerAction'
        ];
        const disallowedActionCalls = ['batchSend', 'batchSave', 'batchDelete'];
        const deprecatedCalls = {
            batchSend: 'batchSave',
            getFieldMapping: 'getMetadata',
            setFieldMapping: 'setMetadata'
        };
        const callsReferencingModelsToCheck = ['batchSave', 'batchDelete'];
        traverseFn(ast, {
            CallExpression(path) {
                var _a, _b, _c, _d;
                const lineNumber = (_a = path.node.loc) === null || _a === void 0 ? void 0 : _a.start.line;
                const callee = path.node.callee;
                if (((_b = callee.object) === null || _b === void 0 ? void 0 : _b.type) === 'Identifier' && callee.object.name === 'nango' && ((_c = callee.property) === null || _c === void 0 ? void 0 : _c.type) === 'Identifier') {
                    if (deprecatedCalls[callee.property.name]) {
                        console.warn(chalk.yellow(`nango.${callee.property.name}() used at line ${lineNumber} is deprecated. Use nango.${deprecatedCalls[callee.property.name]}() instead.`));
                    }
                    if (type === SyncConfigType.ACTION) {
                        if (disallowedActionCalls.includes(callee.property.name)) {
                            disallowedMessage(callee.property.name, lineNumber);
                            usedCorrectly = false;
                        }
                    }
                    const isAwaited = path.findParent((parentPath) => parentPath.isAwaitExpression());
                    const isThenOrCatch = path.findParent((parentPath) => t.isMemberExpression(parentPath.node) &&
                        (t.isIdentifier(parentPath.node.property, { name: 'then' }) || t.isIdentifier(parentPath.node.property, { name: 'catch' })));
                    const isReturned = Boolean(path.findParent((parentPath) => t.isReturnStatement(parentPath.node)));
                    if (!isAwaited && !isThenOrCatch && !isReturned && nangoCalls.includes(callee.property.name)) {
                        awaitMessage(callee.property.name, lineNumber);
                        areAwaited = false;
                    }
                    if (callsReferencingModelsToCheck.includes(callee.property.name)) {
                        const args = path.node.arguments;
                        const modelArg = args[args.length - 1];
                        if (t.isStringLiteral(modelArg) && !modelNames.includes(modelArg.value)) {
                            console.log(chalk.red(`"${modelArg.value}" is not a valid model name. Please check "${filePath}:${lineNumber}". The possible model names are: ${modelNames.join(', ')}`));
                            usedCorrectly = false;
                        }
                    }
                    const callArguments = path.node.arguments;
                    if (callArguments.length > 0 && t.isObjectExpression(callArguments[0])) {
                        let retriesPropertyFound = false;
                        let retryOnPropertyFound = false;
                        callArguments[0].properties.forEach((prop) => {
                            if (t.isObjectProperty(prop)) {
                                if (t.isIdentifier(prop.key) && prop.key.name === 'retries') {
                                    retriesPropertyFound = true;
                                }
                                if (t.isIdentifier(prop.key) && prop.key.name === 'retryOn') {
                                    retryOnPropertyFound = true;
                                }
                            }
                        });
                        if (!retriesPropertyFound && retryOnPropertyFound) {
                            const lineNumber = (_d = path.node.loc) === null || _d === void 0 ? void 0 : _d.start.line;
                            console.log(chalk.red(`Usage of 'retryOn' without 'retries' at "${filePath}:${lineNumber}". 'retryOn' should not be used if 'retries' is not set.`));
                            retryOnUsedCorrectly = false;
                        }
                    }
                }
            },
            ExportDefaultDeclaration(path) {
                var _a;
                const declaration = path.node.declaration;
                function functionReturnsValue(funcNode) {
                    let returnsValue = false;
                    traverseFn(funcNode.body, {
                        ReturnStatement(path) {
                            if (path.node.argument !== null) {
                                returnsValue = true;
                                path.stop();
                            }
                        },
                        FunctionDeclaration(path) {
                            path.skip();
                        },
                        FunctionExpression(path) {
                            path.skip();
                        },
                        ArrowFunctionExpression(path) {
                            path.skip();
                        },
                        noScope: true
                    });
                    return returnsValue;
                }
                if (t.isFunctionDeclaration(declaration) || t.isFunctionExpression(declaration) || t.isArrowFunctionExpression(declaration)) {
                    if (functionReturnsValue(declaration) && type === SyncConfigType.SYNC) {
                        const lineNumber = ((_a = declaration.loc) === null || _a === void 0 ? void 0 : _a.start.line) || 'unknown';
                        console.log(chalk.red(`The default exported function fetchData at "${filePath}:${lineNumber}" must not return a value. Sync scripts should not return but rather use batchSave to save data.`));
                        noReturnUsed = false;
                    }
                }
            }
        });
        return areAwaited && usedCorrectly && noReturnUsed && retryOnUsedCorrectly;
    }
}
const parserService = new ParserService();
export default parserService;
//# sourceMappingURL=parser.service.js.map