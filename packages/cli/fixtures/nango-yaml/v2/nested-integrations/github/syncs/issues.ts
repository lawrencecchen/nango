import type { NangoSync } from '../../types/lib/integration/asana.js';

export default async function fetchData(nango: NangoSync): Promise<void> {
    await nango.log('Fetching issues...');
}
