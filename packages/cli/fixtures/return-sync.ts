import type { NangoSync } from './models.js';

export default async function fetchData(nango: NangoSync) {
    const resp = await nango.get({
        endpoint: 'foo'
    });

    return resp;
}
