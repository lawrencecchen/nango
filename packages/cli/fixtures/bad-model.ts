import type { NangoSync } from './models.js';

export default async function fetchData(nango: NangoSync) {
    await nango.batchSave(['data'], 'SomeBadModel');
}
