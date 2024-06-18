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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const customReportData = {
            title: 'Current Employees',
            filters: {
                lastChanged: Object.assign({ includeNull: 'no' }, (nango.lastSyncDate ? { value: ((_a = nango.lastSyncDate) === null || _a === void 0 ? void 0 : _a.toISOString().split('.')[0]) + 'Z' } : {}) //remove milliseconds
                )
            },
            fields: [
                'id',
                'employeeNumber',
                'firstName',
                'lastName',
                'dateOfBirth',
                'address1',
                'bestEmail',
                'jobTitle',
                'hireDate',
                'supervisorId',
                'supervisor',
                'createdByUserId',
                'department',
                'division',
                'employmentHistoryStatus',
                'gender',
                'country',
                'city',
                'location',
                'state',
                'maritalStatus',
                'exempt',
                'payRate',
                'payType',
                'payPer',
                'ssn',
                'workPhone',
                'homePhone'
            ]
        };
        try {
            const response = yield nango.post({
                endpoint: '/v1/reports/custom',
                params: {
                    format: 'JSON',
                    onlyCurrent: true.toString() //limits the report to only current employees
                },
                data: customReportData
            });
            const employees = response.data.employees;
            const chunkSize = 100;
            for (let i = 0; i < employees.length; i += chunkSize) {
                const chunk = employees.slice(i, i + chunkSize);
                const mappedEmployees = mapEmployee(chunk);
                const batchSize = mappedEmployees.length;
                yield nango.log(`Saving batch of ${batchSize} employee(s)`);
                yield nango.batchSave(mappedEmployees, 'BamboohrEmployee');
            }
            yield nango.log(`Total employee(s) processed: ${employees.length}`);
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function mapEmployee(employees) {
    return employees.map((employee) => ({
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        dateOfBirth: employee.dateOfBirth,
        address1: employee.address1,
        bestEmail: employee.bestEmail,
        jobTitle: employee.jobTitle,
        hireDate: employee.hireDate,
        supervisorId: employee.supervisorId,
        supervisor: employee.supervisor,
        createdByUserId: employee.createdByUserId,
        department: employee.department,
        division: employee.division,
        employmentHistoryStatus: employee.employmentHistoryStatus,
        gender: employee.gender,
        country: employee.country,
        city: employee.city,
        location: employee.location,
        state: employee.state,
        maritalStatus: employee.maritalStatus,
        exempt: employee.exempt,
        payRate: employee.payRate,
        payType: employee.payType,
        payPer: employee.payPer,
        ssn: employee.ssn,
        workEmail: employee.workEmail,
        workPhone: employee.workPhone,
        homePhone: employee.homePhone
    }));
}
//# sourceMappingURL=employees.js.map