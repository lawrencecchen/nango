import type { NangoAction } from '../../types/lib/integration/asana';

export default async function runAction(nango: NangoAction): Promise<void> {
    await nango.log('Creating issue...');
}
