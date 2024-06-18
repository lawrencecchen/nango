const path = '/health';
const method = 'GET';
export const routeHandler = {
    path,
    method,
    validate: (_req, _res, next) => next(),
    handler: (_req, res) => res.status(200).json({ status: 'ok' })
};
//# sourceMappingURL=getHealth.js.map