import type { NangoSync } from '../../types/lib/integration/asana';

export default async function fetchData(nango: NangoSync): Promise<void> {
    await nango.log('Fetching contacts...');
}
