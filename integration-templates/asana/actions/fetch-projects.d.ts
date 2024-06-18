import type { NangoAction, BaseAsanaModel, AsanaProjectInput } from '../../types/lib/integration/asana.js';
export default function runAction(nango: NangoAction, input: AsanaProjectInput): Promise<BaseAsanaModel[]>;
