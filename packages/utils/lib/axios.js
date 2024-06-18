import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';
import http from 'node:http';
import https from 'node:https';
export let httpAgent = new http.Agent();
export let httpsAgent = new https.Agent();
const hasHttpProxy = process.env['http_proxy'] || process.env['HTTP_PROXY'];
const hasHttpsProxy = process.env['https_proxy'] || process.env['HTTPS_PROXY'];
if (hasHttpProxy) {
    httpAgent = new HttpProxyAgent(hasHttpProxy);
}
if (hasHttpsProxy) {
    httpsAgent = new HttpsProxyAgent(hasHttpsProxy);
}
export const axiosInstance = axios.create({
    httpAgent: httpAgent,
    httpsAgent: httpsAgent
});
//# sourceMappingURL=axios.js.map