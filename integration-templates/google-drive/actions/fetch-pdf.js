var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
export default function runAction(nango, input) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!input || typeof input !== 'string') {
            throw new Error('Missing or invalid input: a pdf id is required and should be a string');
        }
        const response = yield nango.get({
            endpoint: `drive/v3/files/${input}`,
            params: {
                alt: 'media'
            },
            responseType: 'stream'
        });
        if (response.status !== 200) {
            throw new Error(`Failed to retrieve file: Status Code ${response.status}`);
        }
        const chunks = [];
        try {
            try {
                for (var _b = __asyncValues(response.data), _c; _c = yield _b.next(), !_c.done;) {
                    const chunk = _c.value;
                    chunks.push(chunk);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (streamError) {
            throw new Error(`Error during stream processing: ${streamError.message}`);
        }
        const buffer = Buffer.concat(chunks);
        const base64Data = buffer.toString('base64');
        return base64Data;
    });
}
//# sourceMappingURL=fetch-pdf.js.map