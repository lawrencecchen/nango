var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db from '@nangohq/database';
import { env } from '@nangohq/utils';
import remoteFileService from '../file/remote.service.js';
import { increment } from './config/config.service.js';
import configService from '../config.service.js';
const TABLE = '_nango_post_connection_scripts';
export const postConnectionScriptService = {
    update({ environment, account, postConnectionScriptsByProvider }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const postConnectionInserts = [];
                for (const postConnectionScriptByProvider of postConnectionScriptsByProvider) {
                    const { providerConfigKey, scripts } = postConnectionScriptByProvider;
                    for (const script of scripts) {
                        const { name, fileBody } = script;
                        const config = yield configService.getProviderConfig(providerConfigKey, environment.id);
                        if (!config || !config.id) {
                            continue;
                        }
                        const previousScriptVersion = yield trx
                            .from(TABLE)
                            .select('version')
                            .where({
                            config_id: config.id,
                            name,
                            active: true
                        })
                            .first();
                        const version = previousScriptVersion ? increment(previousScriptVersion.version) : '0.0.1';
                        yield trx
                            .from(TABLE)
                            .where({
                            config_id: config.id,
                            name
                        })
                            .update({
                            active: false
                        });
                        const file_location = yield remoteFileService.upload(fileBody.js, `${env}/account/${account.id}/environment/${environment.id}/config/${config.id}/${name}-v${version}.js`, environment.id);
                        if (!file_location) {
                            throw new Error(`Failed to upload the post connection script file: ${name}`);
                        }
                        yield remoteFileService.upload(fileBody.ts, `${env}/account/${account.id}/environment/${environment.id}/config/${config.id}/${name}.ts`, environment.id);
                        postConnectionInserts.push({
                            config_id: config.id,
                            name,
                            file_location,
                            version: version.toString(),
                            active: true
                        });
                    }
                }
                yield trx.insert(postConnectionInserts).into(TABLE);
            }));
        });
    },
    getByConfig: (configId) => __awaiter(void 0, void 0, void 0, function* () {
        return db.knex.from(TABLE).where({ config_id: configId, active: true });
    })
};
//# sourceMappingURL=post-connection.service.js.map