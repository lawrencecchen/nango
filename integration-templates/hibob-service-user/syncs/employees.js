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
        try {
            const response = yield nango.post({
                endpoint: '/v1/people/search'
            });
            const employees = response.data.employees;
            const chunkSize = 100;
            for (let i = 0; i < employees.length; i += chunkSize) {
                const chunk = employees.slice(i, i + chunkSize);
                const mappedEmployees = mapEmployee(chunk);
                const batchSize = mappedEmployees.length;
                yield nango.log(`Saving batch of ${batchSize} employee(s)`);
                yield nango.batchSave(mappedEmployees, 'HibobEmployee');
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
        firstName: employee.firstName,
        surname: employee.surname,
        email: employee.email,
        displayName: employee.displayName,
        personal: employee.personal,
        about: employee.about,
        work: employee.work
    }));
}
//# sourceMappingURL=employees.js.map