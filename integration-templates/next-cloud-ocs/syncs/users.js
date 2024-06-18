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
        let totalRecords = 0;
        try {
            const userIDs = yield getAllUsers(nango);
            for (const userId of userIDs) {
                const specificUser = yield getSpecificUser(nango, userId);
                if (specificUser) {
                    const mappedUser = mapUser(specificUser);
                    totalRecords++;
                    yield nango.log(`Saving user details for user: ${specificUser.id} (total user(s): ${totalRecords})`);
                    yield nango.batchSave([mappedUser], 'NextCloudUser');
                }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function getAllUsers(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        const endpoint = '/cloud/users';
        const response = yield nango.get({ endpoint });
        records.push(...response.data.ocs.data.users);
        return records;
    });
}
function getSpecificUser(nango, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = `/cloud/users/${userId}`;
        try {
            const specificUser = yield nango.get({ endpoint });
            return mapUser(specificUser.data.ocs.data);
        }
        catch (error) {
            throw new Error(`Error in getSpecificUser: ${error.message}`);
        }
    });
}
function mapUser(user) {
    return {
        enabled: user.enabled,
        id: user.id,
        lastLogin: user.lastLogin,
        backend: user.backend,
        subadmin: user.subadmin,
        quota: user.quota,
        manager: user.manager,
        avatarScope: user.avatarScope,
        email: user.email,
        emailScope: user.emailScope,
        additional_mail: user.additional_mail,
        additional_mailScope: user.additional_mailScope,
        displayname: user.displayname,
        display_name: user['display-name'],
        displaynameScope: user.displaynameScope,
        phone: user.phone,
        phoneScope: user.phoneScope,
        address: user.address,
        addressScope: user.addressScope,
        website: user.website,
        websiteScope: user.websiteScope,
        twitter: user.twitter,
        twitterScope: user.twitterScope,
        fediverse: user.fediverse,
        fediverseScope: user.fediverseScope,
        organisation: user.organisation,
        organisationScope: user.organisationScope,
        role: user.role,
        roleScope: user.roleScope,
        headline: user.headline,
        headlineScope: user.headlineScope,
        biography: user.biography,
        biographyScope: user.biographyScope,
        profile_enabled: user.profile_enabled,
        profile_enabledScope: user.profile_enabledScope,
        groups: user.groups,
        language: user.language,
        locale: user.locale,
        notify_email: user.notify_email,
        backendCapabilities: user.backendCapabilities
    };
}
//# sourceMappingURL=users.js.map