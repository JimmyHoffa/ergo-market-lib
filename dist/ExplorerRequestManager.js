"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerRequestManager = void 0;
const axios_1 = __importDefault(require("axios"));
const json_bigint_1 = __importDefault(require("json-bigint"));
class ExplorerRequestManager {
    explorerUri;
    throwOnError;
    JSONBI = (0, json_bigint_1.default)({ useNativeBigInt: true });
    explorerHttpClient;
    constructor(explorerUri = 'https://api.ergoplatform.com', throwOnError = true, axiosInstanceConfig = {}) {
        this.explorerUri = explorerUri;
        this.throwOnError = throwOnError;
        this.explorerHttpClient = axios_1.default.create({
            baseURL: explorerUri,
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' },
            ...axiosInstanceConfig,
        });
    }
    async requestWithRetries(config, retriesLeft = 5, retryWaitTime = 2000, throwOnError = this.throwOnError) {
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
            console.log('EX occurred on axios request, retry...', ex.message);
            return new Promise((res) => {
                setTimeout(() => res(this.requestWithRetries(config, retriesLeft - 1)), retryWaitTime);
            });
        }
    }
}
exports.ExplorerRequestManager = ExplorerRequestManager;
//# sourceMappingURL=ExplorerRequestManager.js.map