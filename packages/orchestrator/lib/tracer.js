import tracer from 'dd-trace';
tracer.init({
    service: 'nango-orchestrator'
});
tracer.use('pg', {
    service: (params) => `postgres-${params.database}`
});
tracer.use('express');
//# sourceMappingURL=tracer.js.map