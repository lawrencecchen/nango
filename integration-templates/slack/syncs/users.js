var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        // Fetch all users (paginated)
        let nextCursor = 'x';
        let responses = [];
        while (nextCursor !== '') {
            const response = yield nango.get({
                endpoint: 'users.list',
                retries: 10,
                params: {
                    limit: '200',
                    cursor: nextCursor !== 'x' ? nextCursor : ''
                }
            });
            if (!response.data.ok) {
                yield nango.log(`Received a Slack API error: ${JSON.stringify(response.data, null, 2)}`);
            }
            const { members, response_metadata } = response.data;
            responses = responses.concat(members);
            nextCursor = response_metadata.next_cursor;
        }
        // Transform users into our data model
        const users = responses.map((record) => {
            return {
                id: record.id,
                team_id: record.team_id,
                name: record.name,
                deleted: record.deleted,
                tz: record.tz,
                tz_label: record.tz_label,
                tz_offset: record.tz_offset,
                profile: {
                    avatar_hash: record.profile.avatar_hash,
                    real_name: record.profile.real_name ? record.profile.real_name : null,
                    display_name: record.profile.display_name ? record.profile.display_name : null,
                    real_name_normalized: record.profile.real_name_normalized ? record.profile.real_name_normalized : null,
                    display_name_normalized: record.profile.display_name_normalized ? record.profile.display_name_normalized : null,
                    email: record.profile.email ? record.profile.email : null,
                    image_original: record.profile.is_custom_image ? record.profile.image_original : null
                },
                is_admin: record.is_admin,
                is_owner: record.is_owner,
                is_primary_owner: record.is_primary_owner,
                is_restricted: record.is_restricted,
                is_ultra_restricted: record.is_ultra_restricted,
                is_bot: record.is_bot,
                updated: record.updated,
                is_app_user: record.is_app_user,
                raw_json: JSON.stringify(record)
            };
        });
        yield nango.batchSave(users, 'SlackUser');
    });
}
//# sourceMappingURL=users.js.map