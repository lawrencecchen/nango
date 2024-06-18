import type { NangoSync } from './models.js';

export default async function fetchData(nango: NangoSync) {
    await nango.get({
        endpoint: 'foo'
    });

    nango
        .get({
            endpoint: 'foo'
        })
        .then((result) => {
            console.log(result);
        })
        .catch((err: unknown) => {
            console.log(err);
        });

    return;
}
