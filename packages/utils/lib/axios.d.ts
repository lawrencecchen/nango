/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import type { Agent as HttpAgent } from 'node:http';
import type { Agent as HttpsAgent } from 'node:https';
export declare let httpAgent: HttpProxyAgent<string> | HttpAgent;
export declare let httpsAgent: HttpsProxyAgent<string> | HttpsAgent;
export declare const axiosInstance: import('axios').AxiosInstance;
