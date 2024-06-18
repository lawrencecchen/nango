"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_toastify_1 = require("react-toastify");
const debounce_1 = __importDefault(require("lodash/debounce"));
const react_router_dom_1 = require("react-router-dom");
const outline_1 = require("@heroicons/react/24/outline");
const swr_1 = require("swr");
const api_1 = require("../../utils/api");
const LeftNavBar_1 = require("../../components/LeftNavBar");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const IntegrationLogo_1 = __importDefault(require("../../components/ui/IntegrationLogo"));
const store_1 = require("../../store");
function Create() {
    const { mutate } = (0, swr_1.useSWRConfig)();
    const env = (0, store_1.useStore)((state) => state.env);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [initialProviders, setInitialProviders] = (0, react_1.useState)(null);
    const [providers, setProviders] = (0, react_1.useState)(null);
    const getIntegrationDetailsAPI = (0, api_1.useGetIntegrationDetailsAPI)(env);
    const getProvidersAPI = (0, api_1.useGetProvidersAPI)(env);
    const createIntegrationAPI = (0, api_1.useCreateEmptyIntegrationAPI)(env);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        const getProviders = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield getProvidersAPI();
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                const data = yield res.json();
                setProviders(data);
                setInitialProviders(data);
            }
        });
        if (!loaded) {
            setLoaded(true);
            getProviders();
        }
    }, [getIntegrationDetailsAPI, getProvidersAPI, loaded, setLoaded]);
    const onCreateIntegration = (provider) => __awaiter(this, void 0, void 0, function* () {
        const res = yield createIntegrationAPI(provider);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Integration created!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            const data = yield res.json();
            void mutate((key) => typeof key === 'string' && key.startsWith('/api/v1/integration'), undefined);
            navigate(`/${env}/integration/${data.config.unique_key}#auth`);
        }
    });
    const showDocs = (e, provider) => {
        var _a;
        e.stopPropagation();
        const documentationUrl = (_a = provider.docs) !== null && _a !== void 0 ? _a : `https://docs.nango.dev/integrations/all/${provider.name}`;
        window.open(documentationUrl, '_blank');
    };
    const filterProviders = (0, react_1.useCallback)((value) => {
        if (!value.trim()) {
            setProviders(initialProviders);
            return;
        }
        const lowercaseValue = value.toLowerCase();
        const filtered = initialProviders === null || initialProviders === void 0 ? void 0 : initialProviders.filter((provider) => {
            var _a;
            return provider.name.toLowerCase().includes(lowercaseValue) ||
                ((_a = provider.categories) === null || _a === void 0 ? void 0 : _a.some((category) => category.toLowerCase().includes(lowercaseValue)));
        });
        setProviders(filtered);
    }, [initialProviders]);
    const debouncedFilterProviders = (0, react_1.useMemo)(() => (0, debounce_1.default)(filterProviders, 300), [filterProviders]);
    const handleInputChange = (0, react_1.useCallback)((event) => {
        debouncedFilterProviders(event.currentTarget.value);
    }, [debouncedFilterProviders]);
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Integrations}>
            {providers && (<div className="w-full">
                    <h2 className="text-left text-3xl font-semibold tracking-tight text-white mb-8">Create Integration</h2>
                    <div className="relative">
                        <div className="h-fit rounded-md text-white text-sm">
                            <outline_1.MagnifyingGlassIcon className="absolute top-2 left-4 h-5 w-5 text-gray-400"/>
                            <input id="search" name="search" type="text" placeholder="Search APIs or category" className="border-border-gray bg-active-gray indent-8 text-white block w-full appearance-none rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none" onChange={handleInputChange} onKeyUp={handleInputChange}/>
                        </div>
                    </div>
                    <div className="flex flex-wrap text-white w-full">
                        {providers.map((provider) => (<div key={provider.name} className="flex justify-between px-2 p-2 mr-2 mt-4 mb-5 w-[14.7rem] border border-transparent rounded cursor-pointer items-center text-sm hover:bg-hover-gray" onClick={() => onCreateIntegration(provider.name)}>
                                <div className="flex items-center">
                                    <IntegrationLogo_1.default provider={provider.name} height={12} width={12} classNames="mr-2"/>
                                    <div className="flex flex-col flex-start">
                                        <span className="flex capitalize">{provider.name.replace(/-/g, ' ')}</span>
                                        {provider.categories && <span className="flex text-xs text-gray-400">{provider.categories.join(', ')}</span>}
                                    </div>
                                </div>
                                <outline_1.BookOpenIcon onClick={(e) => showDocs(e, provider)} className="h-5 w-5 text-gray-400 hover:text-white hover:bg-hover-gray"/>
                            </div>))}
                    </div>
                </div>)}
        </DashboardLayout_1.default>);
}
exports.default = Create;
//# sourceMappingURL=Create.js.map