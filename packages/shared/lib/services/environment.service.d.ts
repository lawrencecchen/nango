import type { EnvironmentVariable } from '@nangohq/types';

import type { Environment } from '../models/Environment.js';
import type { Account } from '../models/Admin.js';
export declare const defaultEnvironments: string[];
declare class EnvironmentService {
    getEnvironmentsByAccountId(account_id: number): Promise<Pick<Environment, 'name'>[]>;
    getAccountAndEnvironmentBySecretKey(secretKey: string): Promise<{
        account: Account;
        environment: Environment;
    } | null>;
    getAccountIdFromEnvironment(environment_id: number): Promise<number | null>;
    getAccountFromEnvironment(environment_id: number): Promise<Account | null>;
    getAccountUUIDFromEnvironmentUUID(environment_uuid: string): Promise<string | null>;
    getAccountAndEnvironmentByPublicKey(publicKey: string): Promise<{
        account: Account;
        environment: Environment;
    } | null>;
    getAccountAndEnvironment(
        opts:
            | {
                  publicKey: string;
              }
            | {
                  secretKey: string;
              }
            | {
                  accountId: number;
                  envName: string;
              }
            | {
                  environmentId: number;
              }
            | {
                  environmentUuid: string;
              }
            | {
                  accountUuid: string;
                  envName: string;
              }
    ): Promise<{
        account: Account;
        environment: Environment;
    } | null>;
    getIdByUuid(uuid: string): Promise<number | null>;
    getById(id: number): Promise<Environment | null>;
    getRawById(id: number): Promise<Environment | null>;
    getByEnvironmentName(accountId: number, name: string): Promise<Environment | null>;
    createEnvironment(accountId: number, environment: string): Promise<Environment | null>;
    createDefaultEnvironments(accountId: number): Promise<void>;
    getEnvironmentName(id: number): Promise<string | null>;
    /**
     * Get Environment Id For Account Assuming Prod
     * @desc legacy function to get the environment id for an account assuming prod
     * while the transition is being made from account_id to environment_id
     */
    getEnvironmentIdForAccountAssumingProd(accountId: number): Promise<number | null>;
    editCallbackUrl(callbackUrl: string, id: number): Promise<Environment | null>;
    editHmacEnabled(hmacEnabled: boolean, id: number): Promise<Environment | null>;
    editSlackNotifications(slack_notifications: boolean, id: number): Promise<Environment | null>;
    getSlackNotificationsEnabled(environmentId: number): Promise<boolean | null>;
    editHmacKey(hmacKey: string, id: number): Promise<Environment | null>;
    getEnvironmentVariables(environment_id: number): Promise<EnvironmentVariable[] | null>;
    editEnvironmentVariable(
        environment_id: number,
        values: {
            name: string;
            value: string;
        }[]
    ): Promise<number[] | null>;
    rotateKey(id: number, type: string): Promise<string | null>;
    revertKey(id: number, type: string): Promise<string | null>;
    activateKey(id: number, type: string): Promise<boolean>;
    rotateSecretKey(id: number): Promise<string | null>;
    rotatePublicKey(id: number): Promise<string | null>;
    revertSecretKey(id: number): Promise<string | null>;
    revertPublicKey(id: number): Promise<string | null>;
    activateSecretKey(id: number): Promise<boolean>;
    activatePublicKey(id: number): Promise<boolean>;
}
export declare function hashSecretKey(key: string): Promise<string>;
declare const _default: EnvironmentService;
export default _default;
