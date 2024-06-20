import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { request as httpRequestNative, Agent as HttpAgent } from 'node:http';
import { request as httpsRequestNative, Agent as HttpsAgent } from 'node:https';
export let httpAgent = new HttpAgent();
export let httpsAgent = new HttpsAgent();
const hasHttpProxy = process.env['http_proxy'] || process.env['HTTP_PROXY'];
const hasHttpsProxy = process.env['https_proxy'] || process.env['HTTPS_PROXY'];
if (hasHttpProxy) {
    httpAgent = new HttpProxyAgent(hasHttpProxy);
}
if (hasHttpsProxy) {
    httpsAgent = new HttpsProxyAgent(hasHttpsProxy);
}
export async function httpRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = httpRequestNative(options, (res) => {
            resolve(res);
        });
        req.on('error', (e) => {
            reject(e);
        });
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}
export async function httpsRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = httpsRequestNative(options, (res) => {
            resolve(res);
        });
        req.on('error', (e) => {
            reject(e);
        });
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}
//# sourceMappingURL=axios.js.map