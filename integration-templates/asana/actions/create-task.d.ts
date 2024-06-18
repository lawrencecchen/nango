import type { AsanaTask } from '@nangohq/types/lib/integration/asana.js';
import { NangoAction } from '@nangohq/shared/lib/sdk/sync.js';
export default function runAction(nango: NangoAction, input: any): Promise<AsanaTask>;
