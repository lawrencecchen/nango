"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("../../../components/ui/label/http");
function EndpointLabel({ type, endpoint }) {
    return (<>
            {typeof endpoint === 'object' ? (<http_1.HttpLabel endpoint={endpoint}/>) : (<>
                    {(endpoint === null || endpoint === void 0 ? void 0 : endpoint.split(' ').length) === 1 && type === 'sync' && <http_1.GET path={endpoint}/>}
                    {(endpoint === null || endpoint === void 0 ? void 0 : endpoint.split(' ').length) === 1 && type === 'action' && <http_1.POST path={endpoint}/>}
                    <http_1.HttpLabel endpoint={{ [endpoint === null || endpoint === void 0 ? void 0 : endpoint.split(' ')[0]]: endpoint === null || endpoint === void 0 ? void 0 : endpoint.split(' ')[1] }}/>
                </>)}
        </>);
}
exports.default = EndpointLabel;
//# sourceMappingURL=EndpointLabel.js.map