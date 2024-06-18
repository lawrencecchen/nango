import type { NangoAction } from '../../types/lib/integration/asana.js';

export default async function runAction(nango: NangoAction): Promise<void> {
    await nango.log('Creating contact...');
}
