/// <reference types="node" />
/// <reference types="node" />
import type { CipherGCMTypes } from 'crypto';
export declare class Encryption {
    protected key: string;
    protected algo: CipherGCMTypes;
    protected encoding: BufferEncoding;
    private encryptionKeyByteLength;
    constructor(key: string);
    getKey(): string;
    encrypt(str: string): [string, string, string];
    decrypt(enc: string, iv: string, authTag: string): string;
}
