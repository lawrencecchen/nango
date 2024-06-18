import { z } from 'zod';
const jsonLiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const jsonSchema = z.lazy(() => z.union([jsonLiteralSchema, z.array(jsonSchema), z.record(jsonSchema)]));
//# sourceMappingURL=validation.js.map