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
export default function fetchData(nango) {
    var e_1, _a;
    var _b;
    return __awaiter(this, void 0, void 0, function* () {
        let totalRecords = 0;
        try {
            const endpoint = '/v1/activities/collection';
            const config = Object.assign(Object.assign({}, (nango.lastSyncDate ? { params: { since: (_b = nango.lastSyncDate) === null || _b === void 0 ? void 0 : _b.toISOString() } } : {})), { paginate: {
                    type: 'cursor',
                    cursor_path_in_response: 'additional_data.next_cursor',
                    cursor_name_in_request: 'cursor',
                    limit_name_in_request: 'limit',
                    response_path: 'data',
                    limit: 100
                } });
            try {
                for (var _c = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _d; _d = yield _c.next(), !_d.done;) {
                    const activity = _d.value;
                    const mappedActivity = activity.map(mapActivity) || [];
                    // Save Activitiy
                    const batchSize = mappedActivity.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} activities (total activities: ${totalRecords})`);
                    yield nango.batchSave(mappedActivity, 'PipeDriveActivity');
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) yield _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function mapActivity(activity) {
    return {
        id: activity.id,
        done: activity.done,
        type: activity.type,
        duration: activity.duration,
        subject: activity.subject,
        company_id: activity.company_id,
        user_id: activity.user_id,
        conference_meeting_client: activity.conference_meeting_client,
        conference_meeting_url: activity.conference_meeting_url,
        conference_meeting_id: activity.conference_meeting_id,
        due_date: activity.due_date,
        due_time: activity.due_time,
        busy_flag: activity.busy_flag,
        add_time: activity.add_time,
        marked_as_done_time: activity.marked_as_done_time,
        public_description: activity.public_description,
        location: activity.location,
        org_id: activity.org_id,
        person_id: activity.person_id,
        deal_id: activity.deal_id,
        active_flag: activity.active_flag,
        update_time: activity.update_time,
        update_user_id: activity.update_user_id,
        source_timezone: activity.source_timezone,
        lead_id: activity.lead_id,
        location_subpremise: activity.location_subpremise,
        location_street_number: activity.location_street_number,
        location_route: activity.location_route,
        location_sublocality: activity.location_sublocality,
        location_locality: activity.location_locality,
        location_admin_area_level_1: activity.location_admin_area_level_1,
        location_admin_area_level_2: activity.location_admin_area_level_2,
        location_country: activity.location_country,
        location_postal_code: activity.location_postal_code,
        location_formatted_address: activity.location_formatted_address,
        project_id: activity.project_id
    };
}
//# sourceMappingURL=activities.js.map