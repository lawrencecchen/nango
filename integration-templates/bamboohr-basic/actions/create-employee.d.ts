import type { NangoAction, BamboohrEmployee, BamboohrCreateEmployeeResponse } from '../../types/lib/integration/asana.js';
export default function runAction(nango: NangoAction, input: BamboohrEmployee): Promise<BamboohrCreateEmployeeResponse>;
