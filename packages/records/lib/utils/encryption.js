import { Encryption } from '@nangohq/utils';
import { envs } from '../env.js';
function getEncryption() {
    const encryptionKey = envs.NANGO_ENCRYPTION_KEY;
    if (!encryptionKey) {
        throw new Error('NANGO_ENCRYPTION_KEY is not set');
    }
    return new Encryption(encryptionKey);
}
function isEncrypted(data) {
    return 'encryptedValue' in data;
}
export function decryptRecord(record) {
    const encryptionManager = getEncryption();
    const { json } = record;
    if (isEncrypted(json)) {
        const { encryptedValue, iv, authTag } = json;
        const decryptedString = encryptionManager.decrypt(encryptedValue, iv, authTag);
        return JSON.parse(decryptedString);
    }
    return json;
}
export function decryptRecords(records) {
    const decryptedRecords = [];
    for (const record of records) {
        decryptedRecords.push(Object.assign(Object.assign({}, record), { record: decryptRecord(record) }));
    }
    return decryptedRecords;
}
export function encryptRecords(records) {
    const encryptionManager = getEncryption();
    const encryptedDataRecords = Object.assign([], records);
    for (const record of encryptedDataRecords) {
        const [encryptedValue, iv, authTag] = encryptionManager.encrypt(JSON.stringify(record.json));
        record.json = { encryptedValue, iv, authTag };
    }
    return encryptedDataRecords;
}
//# sourceMappingURL=encryption.js.map