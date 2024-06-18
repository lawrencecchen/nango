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
const CHUNK_SIZE = 100;
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const totalRecords = 0;
        try {
            const jobs = yield getAllJobs(nango);
            for (const job of jobs) {
                const endpoint = `/spi/v3/jobs/${job.shortcode}/questions`;
                const response = yield nango.get({ endpoint });
                const questions = response.data.questions || [];
                const mappedQuestions = questions.map(mapQuestion) || [];
                // Process questions in chunks since the endpoint doesn't offer pagination
                yield processChunks(nango, mappedQuestions, job.shortcode, totalRecords);
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function processChunks(nango, data, shortcode, totalRecords) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE);
            const batchSize = chunk.length;
            totalRecords += batchSize;
            yield nango.log(`Saving batch of ${batchSize} question(s) for job ${shortcode} (total question(s): ${totalRecords})`);
            yield nango.batchSave(chunk, 'WorkableJobQuestion');
        }
    });
}
function getAllJobs(nango) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        const config = {
            endpoint: '/spi/v3/jobs',
            paginate: {
                type: 'link',
                link_path_in_response_body: 'paging.next',
                limit_name_in_request: 'limit',
                response_path: 'jobs',
                limit: 100
            }
        };
        try {
            for (var _b = __asyncValues(nango.paginate(config)), _c; _c = yield _b.next(), !_c.done;) {
                const recordBatch = _c.value;
                records.push(...recordBatch);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return records;
    });
}
function mapQuestion(question) {
    return {
        id: question.id,
        body: question.body,
        type: question.type,
        required: question.required,
        single_answer: question.single_answer,
        choices: question.choices,
        supported_file_types: question.supported_file_types,
        max_file_size: question.max_file_size
    };
}
//# sourceMappingURL=jobs-questions.js.map