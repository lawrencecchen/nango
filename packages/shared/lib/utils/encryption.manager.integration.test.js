var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { beforeAll, describe, expect, it } from 'vitest';
import db, { multipleMigrations } from '@nangohq/database';
import encryptionManager, { EncryptionManager } from './encryption.manager.js';
import { seedAccountEnvAndUser } from '../seeders/index.js';
import environmentService from '../services/environment.service.js';
describe('encryption', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
    }));
    describe('status', () => {
        it('should report disabled if no key and no previous key', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield new EncryptionManager('').encryptionStatus();
            expect(res).toBe('disabled');
        }));
        it('should report not_started if key and no previous key', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield new EncryptionManager('aHcTnJX5yaDJHF/EJLc6IMFSo2+aiz1hPsTkpsufxa0=').encryptionStatus();
            expect(res).toBe('not_started');
        }));
        it('should report require_decryption if no key and one previous key', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield new EncryptionManager('').encryptionStatus({ encryption_complete: true, encryption_key_hash: 'erer' });
            expect(res).toBe('require_decryption');
        }));
        it('should report require_rotation if different keys', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield new EncryptionManager('aHcTnJX5yaDJHF/EJLc6IMFSo2+aiz1hPsTkpsufxa0=').encryptionStatus({
                encryption_complete: true,
                encryption_key_hash: 'erer'
            });
            expect(res).toBe('require_rotation');
        }));
        it('should report incomplete if same key but not finished', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield new EncryptionManager('aHcTnJX5yaDJHF/EJLc6IMFSo2+aiz1hPsTkpsufxa0=').encryptionStatus({
                encryption_complete: false,
                encryption_key_hash: 'sM+EkzNi7o4Crw3cVfg01jBbmSEAfDdmTzYWoxbryvk='
            });
            expect(res).toBe('incomplete');
        }));
        it('should report done if same key and complete', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield new EncryptionManager('aHcTnJX5yaDJHF/EJLc6IMFSo2+aiz1hPsTkpsufxa0=').encryptionStatus({
                encryption_complete: true,
                encryption_key_hash: 'sM+EkzNi7o4Crw3cVfg01jBbmSEAfDdmTzYWoxbryvk='
            });
            expect(res).toBe('done');
        }));
    });
    describe('encryption', () => {
        it('should encrypt environment', () => __awaiter(void 0, void 0, void 0, function* () {
            // we create a different schema because we have only one DB for all tests
            db.knex.client.config.searchPath = 'nango_encrypt';
            db.schema = () => 'nango_encrypt';
            yield multipleMigrations();
            // Disable encryption manually since it's set by default
            // @ts-expect-error Modify the key on the fly
            encryptionManager.key = '';
            yield db.knex.from(`_nango_db_config`).del();
            const { env } = yield seedAccountEnvAndUser();
            expect(env.secret_key_iv).toBeNull();
            expect(env.secret_key_hashed).toBe(env.secret_key);
            // Re-enable encryption
            // @ts-expect-error Modify the key on the fly
            encryptionManager.key = 'aHcTnJX5yaDJHF/EJLc6IMFSo2+aiz1hPsTkpsufxa0=';
            yield encryptionManager.encryptDatabaseIfNeeded();
            const envAfterEnc = (yield environmentService.getRawById(env.id));
            expect(envAfterEnc.secret_key_iv).not.toBeNull();
            expect(envAfterEnc.secret_key_tag).not.toBeNull();
            expect(envAfterEnc.secret_key).not.toBe(env.secret_key);
            expect(envAfterEnc.secret_key_hashed).not.toBe(env.secret_key);
        }));
    });
});
//# sourceMappingURL=encryption.manager.integration.test.js.map