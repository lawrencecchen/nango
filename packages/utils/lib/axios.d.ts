/// <reference types="node" />
/// <reference types="node" />
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import type { IncomingMessage, RequestOptions as HttpRequestOptions } from 'node:http';
import type { RequestOptions as HttpsRequestOptions } from 'node:https';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
export declare let httpAgent: HttpProxyAgent<string> | HttpAgent;
export declare let httpsAgent: HttpsProxyAgent<string> | HttpsAgent;
export declare function httpRequest(options: HttpRequestOptions, postData?: string): Promise<IncomingMessage>;
export declare function httpsRequest(options: HttpsRequestOptions, postData?: string): Promise<IncomingMessage>;
