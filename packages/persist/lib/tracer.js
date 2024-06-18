import tracer from 'dd-trace';
tracer.init({
    service: 'nango-persist'
});
tracer.use('pg', {
    service: (params) => `postgres-${params.database}`
});
tracer.use('elasticsearch', {
    service: 'nango-elasticsearch'
});
tracer.use('express');
//# sourceMappingURL=tracer.js.map