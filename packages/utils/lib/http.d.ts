/// <reference types="node" />
/// <reference types="node" />
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { IncomingMessage, Agent as HttpAgent, RequestOptions as HttpRequestOptions } from 'node:http';
import { Agent as HttpsAgent, RequestOptions as HttpsRequestOptions } from 'node:https';

export declare let httpAgent: HttpProxyAgent<string> | HttpAgent;
export declare let httpsAgent: HttpsProxyAgent<string> | HttpsAgent;
export declare function httpRequest(options: HttpRequestOptions, postData?: string): Promise<IncomingMessage>;
export declare function httpsRequest(options: HttpsRequestOptions, postData?: string): Promise<IncomingMessage>;

// Removed unused variables
