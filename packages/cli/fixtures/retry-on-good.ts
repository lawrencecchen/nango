import type { NangoSync } from './models.js';

export default async function fetchData(nango: NangoSync) {
    const resp = await nango.get({
        retryOn: [400],
        retries: 5,
        endpoint: 'foo'
    });

    return resp;
}
