import type { NangoAction, Task, AsanaUpdateTask } from '../../types/lib/integration/asana.js';
export default function runAction(nango: NangoAction, input: AsanaUpdateTask): Promise<Task>;
