import knex from 'knex';
import { config } from './config.js.js';

export const db = knex(config);
