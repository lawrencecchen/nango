import type { AxiosInstance, AxiosResponse } from 'axios';
export declare class RenderAPI {
    httpClient: AxiosInstance;
    constructor(apiKey: string);
    getServices(params: { name: string; type: string; limit: string }): Promise<AxiosResponse>;
    createService(data: {
        type: string;
        name: string;
        ownerId: string;
        image: {
            ownerId: string;
            imagePath: string;
        };
        serviceDetails: {
            env: string;
        };
        envVars: {
            key: string;
            value: string;
        }[];
    }): Promise<AxiosResponse>;
    suspendService(params: { serviceId: string }): Promise<AxiosResponse>;
    resumeService(params: { serviceId: string }): Promise<AxiosResponse>;
}
