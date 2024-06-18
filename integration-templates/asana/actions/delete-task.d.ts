import type { NangoAction, Id } from '../../types/lib/integration/asana.js';
export default function runAction(nango: NangoAction, input: Id): Promise<boolean>;
