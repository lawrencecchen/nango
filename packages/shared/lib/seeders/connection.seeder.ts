import db from '@nangohq/database';
import connectionService from '../services/connection.service.js.js';
import type { NangoConnection } from '../models/Connection.js.js';
import type { AuthCredentials } from '../models/Auth.js.js';
import type { Environment } from '../models/Environment.js.js';

export const createConnectionSeeds = async (env: Environment): Promise<number[]> => {
    const connectionIds = [];

    for (let i = 0; i < 4; i++) {
        const name = Math.random().toString(36).substring(7);
        const result = await connectionService.upsertConnection(`conn-${name}`, `provider-${name}`, 'google', {} as AuthCredentials, {}, env.id, 0);
        connectionIds.push(...result.map((res) => res.connection.id!));
    }
    return connectionIds;
};

export const createConnectionSeed = async (env: Environment, provider: string): Promise<NangoConnection> => {
    const name = Math.random().toString(36).substring(7);
    const result = await connectionService.upsertConnection(name, provider, 'google', {} as AuthCredentials, {}, env.id, 0);

    if (!result || result[0] === undefined) {
        throw new Error('Could not create connection seed');
    }

    return { id: result[0].connection.id!, connection_id: name, provider_config_key: provider, environment_id: env.id };
};

export const deleteAllConnectionSeeds = async (): Promise<void> => {
    await db.knex.raw('TRUNCATE TABLE _nango_connections CASCADE');
};
