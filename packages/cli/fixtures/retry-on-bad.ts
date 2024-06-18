import type { NangoSync } from './models.js';

export default async function fetchData(nango: NangoSync) {
    const resp = await nango.get({
        retryOn: [400],
        endpoint: 'foo'
    });

    return resp;
}
