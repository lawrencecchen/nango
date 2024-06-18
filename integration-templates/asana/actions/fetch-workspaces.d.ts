import type { NangoAction, BaseAsanaModel, Limit } from '../../types/lib/integration/asana.js';
export default function runAction(nango: NangoAction, input: Limit): Promise<BaseAsanaModel[]>;
