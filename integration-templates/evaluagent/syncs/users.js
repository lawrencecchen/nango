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
        const payload = {
            endpoint: '/v1/org/users'
        };
        const response = yield nango.get(payload);
        const returnedData = response.data.data;
        const mappedUsers = returnedData.map((user) => ({
            id: user.id,
            forename: user.attributes.forename,
            surname: user.attributes.surname,
            email: user.attributes.email,
            username: user.attributes.username,
            startDate: user.attributes.start_date,
            active: user.attributes.active,
            thirdPartyId: user.attributes.third_party_id
        }));
        if (mappedUsers.length > 0) {
            yield nango.batchSave(mappedUsers, 'EvaluAgentUser');
            yield nango.log(`Sent ${mappedUsers.length} users`);
        }
    });
}
//# sourceMappingURL=users.js.map