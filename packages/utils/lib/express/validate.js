import { z } from 'zod';
export const validateRequest = (parser) => (req, res, next) => {
    try {
        if (parser.parseBody) {
            req.body = parser.parseBody(req.body);
        }
        else {
            z.object({}).strict('Body is not allowed').parse(req.body);
        }
        if (parser.parseQuery) {
            req.query = parser.parseQuery(req.query);
        }
        else {
            z.object({}).strict('Query string parameters are not allowed').parse(req.query);
        }
        if (parser.parseParams) {
            req.params = parser.parseParams(req.params);
        }
        else {
            z.object({}).strict('Url parameters are not allowed').parse(req.params);
        }
        return next();
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).send({ error: { code: 'invalid_request', errors: zodErrorToHTTP(error) } });
        }
    }
};
export function zodErrorToHTTP(error) {
    return error.issues.map(({ code, message, path }) => {
        return { code, message, path };
    });
}
/**
 * Enforce empty request body
 */
export function requireEmptyBody(req) {
    if (!req.body) {
        return;
    }
    const val = z.object({}).strict().safeParse(req.body);
    if (val.success) {
        return;
    }
    return val;
}
/**
 * Enforce empty request query string
 */
export function requireEmptyQuery(req, { withEnv } = { withEnv: false }) {
    const val = z
        .object(withEnv ? { env: z.string().max(250).min(1) } : {})
        .strict()
        .safeParse(req.query);
    if (val.success) {
        return;
    }
    return val;
}
//# sourceMappingURL=validate.js.map