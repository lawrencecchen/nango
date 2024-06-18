"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.PATCH = exports.PUT = exports.POST = exports.GET = exports.HttpLabel = void 0;
function HttpLabel({ endpoint }) {
    return (<>
            {endpoint['GET'] && <GET path={endpoint['GET']}/>}
            {endpoint['POST'] && <POST path={endpoint['POST']}/>}
            {endpoint['PUT'] && <PUT path={endpoint['PUT']}/>}
            {endpoint['PATCH'] && <PATCH path={endpoint['PATCH']}/>}
            {endpoint['DELETE'] && <DELETE path={endpoint['DELETE']}/>}
        </>);
}
exports.HttpLabel = HttpLabel;
function GET({ path }) {
    return (<div className="flex items-center">
            <div className="bg-green-600 bg-opacity-20 py-1 px-2 rounded">
                <span className="text-green-600 font-semibold">GET</span>
            </div>
            <span className="text-gray-400 ml-2 break-all">{path}</span>
        </div>);
}
exports.GET = GET;
function POST({ path }) {
    return (<div className="flex items-center">
            <div className="bg-blue-700 bg-opacity-20 py-1 px-2 rounded">
                <span className="text-blue-700 font-semibold">POST</span>
            </div>
            <span className="text-gray-400 ml-2 break-all">{path}</span>
        </div>);
}
exports.POST = POST;
function PUT({ path }) {
    return (<div className="flex items-center">
            <div className="bg-amber-200 bg-opacity-20 py-1 px-2 rounded">
                <span className="text-amber-200 font-semibold">PUT</span>
            </div>
            <span className="text-gray-400 ml-2 break-all">{path}</span>
        </div>);
}
exports.PUT = PUT;
function PATCH({ path }) {
    return (<div className="flex items-center">
            <div className="bg-orange-700 bg-opacity-20 py-1 px-2 rounded">
                <span className="text-orange-700 font-semibold">PATCH</span>
            </div>
            <span className="text-gray-400 ml-2 break-all">{path}</span>
        </div>);
}
exports.PATCH = PATCH;
function DELETE({ path }) {
    return (<div className="flex items-center">
            <div className="bg-pink-600 bg-opacity-20 py-1 px-2 rounded">
                <span className="text-pink-600 font-semibold">DEL</span>
            </div>
            <span className="text-gray-400 ml-2 break-all">{path}</span>
        </div>);
}
exports.DELETE = DELETE;
//# sourceMappingURL=http.js.map