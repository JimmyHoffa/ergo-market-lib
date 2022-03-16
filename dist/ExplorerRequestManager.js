"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerRequestManager = void 0;
const axios_1 = __importDefault(require("axios"));
const json_bigint_1 = __importDefault(require("json-bigint"));
class ExplorerRequestManager {
    explorerRequestConfig;
    JSONBI = (0, json_bigint_1.default)({ useNativeBigInt: true });
    explorerHttpClient;
    defaultRequestConfig = {
        explorerUri: 'https://api.ergoplatform.com',
        throwOnError: true,
        axiosInstanceConfig: {},
        retryCount: 5,
        retryWaitTime: 2000,
        timeout: 5000,
        headers: {},
    };
    constructor(explorerRequestConfig = {}) {
        this.explorerRequestConfig = explorerRequestConfig;
        this.explorerRequestConfig = {
            ...this.defaultRequestConfig,
            ...this.explorerRequestConfig,
        };
        const { timeout, explorerUri, axiosInstanceConfig, headers } = this.explorerRequestConfig;
        this.explorerHttpClient = axios_1.default.create({
            baseURL: explorerUri,
            timeout,
            headers: { 'Content-Type': 'application/json', ...headers },
            ...axiosInstanceConfig,
        });
    }
    async requestWithRetries(config, retriesLeft = this.explorerRequestConfig.retryCount) {
        const { throwOnError, retryWaitTime } = this.explorerRequestConfig;
        try {
            const { data } = await this.explorerHttpClient.request(config);
            return data;
        }
        catch (ex) {
            if (retriesLeft < 1) {
                if (throwOnError)
                    throw ex;
                return undefined;
            }
            /* eslint-disable-next-line no-console */
            console.log('EX occurred on axios request, retry...', ex.message);
            return new Promise((res) => {
                setTimeout(() => res(this.requestWithRetries(config, retriesLeft - 1)), retryWaitTime);
            });
        }
    }
}
exports.ExplorerRequestManager = ExplorerRequestManager;
//# sourceMappingURL=ExplorerRequestManager.js.map