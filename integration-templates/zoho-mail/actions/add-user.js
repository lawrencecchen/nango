var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function runAction(nango, input) {
    return __awaiter(this, void 0, void 0, function* () {
        //zoid is shorter in this 847300000
        if (!input.zoid || typeof input.zoid !== 'number') {
            throw new nango.ActionError({
                message: 'zoid is a required parameter and needs to be of a non-empty number'
            });
        }
        else if (!input.primaryEmailAddress || typeof input.primaryEmailAddress !== 'string') {
            throw new nango.ActionError({
                message: 'primaryEmailAddress is a required body field and must be of a non-empty string'
            });
        }
        else if (!input.password || typeof input.password !== 'string') {
            throw new nango.ActionError({
                message: 'toAddress is a required body field and must be of a non-empty string'
            });
        }
        try {
            const endpoint = `/api/organization/${input.zoid}/accounts`;
            const postData = {
                primaryEmailAddress: input.primaryEmailAddress,
                password: input.password,
                displayName: input.displayName,
                role: input.role,
                country: input.country,
                language: input.language,
                timeZone: input.timeZone,
                oneTimePassword: input.oneTimePassword,
                groupMailList: input.groupMailList
            };
            const resp = yield nango.post({
                endpoint: endpoint,
                data: postData
            });
            return {
                status: resp.data.status,
                data: resp.data.data
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error}`
            });
        }
    });
}
//# sourceMappingURL=add-user.js.map