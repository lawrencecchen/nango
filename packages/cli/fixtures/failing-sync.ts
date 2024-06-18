import type { NangoSync } from './models.js';

export default async function fetchData(nango: NangoSync) {
    const result = nango.get({
        endpoint: 'foo'
    });

    return result;
}
