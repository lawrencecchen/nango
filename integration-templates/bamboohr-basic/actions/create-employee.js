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
        // Input validation on only required fields
        if (!input.firstName && !input.lastName) {
            throw new nango.ActionError({
                message: 'firstName and lastName are required fields'
            });
        }
        else if (!input.firstName) {
            throw new nango.ActionError({
                message: 'firstName is a required field'
            });
        }
        else if (!input.lastName) {
            throw new nango.ActionError({
                message: 'lastName is a required field'
            });
        }
        try {
            const postData = {
                firstName: input.firstName,
                lastName: input.lastName,
                dateOfBirth: input.dateOfBirth,
                address1: input.address1,
                hireDate: input.hireDate,
                department: input.department,
                division: input.division,
                employeeNumber: input.employeeNumber,
                employmentHistoryStatus: input.employmentHistoryStatus,
                gender: input.gender,
                jobTitle: input.jobTitle,
                country: input.country,
                city: input.city,
                location: input.location,
                state: input.state,
                maritalStatus: input.maritalStatus,
                payRate: input.payRate,
                payType: input.payType,
                ssn: input.ssn,
                workPhone: input.workPhone,
                homePhone: input.homePhone,
                exempt: input.exempt,
                payPer: input.payPer,
                workEmail: input.workEmail
            };
            const response = yield nango.post({
                endpoint: `/v1/employees`,
                data: postData
            });
            return {
                status: response.statusText
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error.message}`
            });
        }
    });
}
//# sourceMappingURL=create-employee.js.map