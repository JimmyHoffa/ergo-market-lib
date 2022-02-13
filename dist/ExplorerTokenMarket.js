"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerTokenMarket = exports.tokenSwapValueFromBox = void 0;
const json_bigint_1 = __importDefault(require("json-bigint"));
const moment_1 = __importDefault(require("moment"));
const ExplorerRequestManager_1 = require("./ExplorerRequestManager");
const math_1 = require("./math");
const PoolSample = '1999030f0400040204020404040405feffffffffffffffff0105feffffffffffffffff01050004d00f040004000406050005000580dac409d819d601b2a5730000d602e4c6a70404d603db63087201d604db6308a7d605b27203730100d606b27204730200d607b27203730300d608b27204730400d6099973058c720602d60a999973068c7205027209d60bc17201d60cc1a7d60d99720b720cd60e91720d7307d60f8c720802d6107e720f06d6117e720d06d612998c720702720fd6137e720c06d6147308d6157e721206d6167e720a06d6177e720906d6189c72117217d6199c72157217d1ededededededed93c27201c2a793e4c672010404720293b27203730900b27204730a00938c7205018c720601938c7207018c72080193b17203730b9593720a730c95720e929c9c721072117e7202069c7ef07212069a9c72137e7214067e9c720d7e72020506929c9c721372157e7202069c7ef0720d069a9c72107e7214067e9c72127e7202050695ed720e917212730d907216a19d721872139d72197210ed9272189c721672139272199c7216721091720b730e';
const JSONBI = (0, json_bigint_1.default)({ useNativeBigInt: true });
const tokenSwapValueFromBox = (box) => {
    const erg = { name: 'ERG', decimals: 9, amount: box.value };
    const token = box.assets[2];
    const ergAmount = (0, math_1.renderFractions)(box.value, 9);
    const tokenAmount = (0, math_1.renderFractions)(token.amount, token.decimals);
    const ergPerToken = math_1.math.evaluate?.(`${ergAmount} / ${tokenAmount}`).toFixed(erg.decimals ?? 0);
    const tokenPerErg = math_1.math.evaluate?.(`${tokenAmount} / ${ergAmount}`).toFixed(token.decimals ?? 0);
    const tokenInfo = {
        name: token.name,
        tokenId: token.tokenId,
        decimals: token.decimals,
    };
    return {
        timestamp: moment_1.default.utc().valueOf(),
        ergPerToken,
        tokenPerErg,
        token: tokenInfo,
    };
};
exports.tokenSwapValueFromBox = tokenSwapValueFromBox;
class ExplorerTokenMarket {
    explorerHttpClient;
    explorerUri = 'https://api.ergoplatform.com';
    defaultRetryCount = 5;
    defaultRetryWaitMillis = 2000;
    throwOnError = true;
    constructor({ explorerUri = 'https://api.ergoplatform.com', defaultRetryCount = 5, defaultRetryWaitMillis = 2000, throwOnError = true, axiosInstanceConfig = {}, } = {
        explorerUri: 'https://api.ergoplatform.com',
        defaultRetryCount: 5,
        defaultRetryWaitMillis: 2000,
        throwOnError: true,
        axiosInstanceConfig: {},
    }) {
        this.explorerUri = explorerUri;
        this.defaultRetryCount = defaultRetryCount;
        this.defaultRetryWaitMillis = defaultRetryWaitMillis;
        this.throwOnError = throwOnError;
        this.explorerHttpClient = new ExplorerRequestManager_1.ExplorerRequestManager(this.explorerUri, this.throwOnError, axiosInstanceConfig);
    }
    async getTokenRates(numberOfTimesToRetry = this.defaultRetryCount, retryWaitTime = this.defaultRetryWaitMillis) {
        const boxItems = await this.explorerHttpClient.requestWithRetries({
            url: `/api/v1/boxes/unspent/byErgoTree/${PoolSample}`,
            params: { limit: 100, offset: 0 },
            transformResponse: (data) => JSONBI.parse(data),
        }, numberOfTimesToRetry, retryWaitTime);
        if (boxItems === undefined)
            return []; // Failed to retrieve values, we got nothin to give back.
        // Deduplicating the tokens because only the first box per token presents an accurate valuation with the dex
        return Object.values(boxItems.items.reduce((acc, box) => {
            const { tokenId } = box.assets[2];
            if (acc[tokenId] === undefined)
                acc[tokenId] = (0, exports.tokenSwapValueFromBox)(box);
            return acc;
        }, {}));
    }
    multiplyFractions(amountA, decimalsA, amountB, decimalsB) {
        const amountAFraction = (0, math_1.renderFractions)(amountA, decimalsA);
        const amountBFraction = (0, math_1.renderFractions)(amountB, decimalsB);
        return math_1.math.evaluate?.(`${amountAFraction} * ${amountBFraction}`).toFixed();
    }
    decorateTokenAmountsWithValues(value, tokenAmountsMap) {
        const tokenBalance = tokenAmountsMap[value.token.tokenId];
        if (tokenBalance === undefined)
            return; // they don't have this token in their wallet
        const { token: { decimals: tokenDecimals }, } = value;
        tokenBalance.confirmed.valueInErgs = this.multiplyFractions(tokenBalance.confirmed.amount, tokenDecimals, value.ergPerToken, 0);
        tokenBalance.unconfirmed.valueInErgs = this.multiplyFractions(tokenBalance.unconfirmed.amount, tokenDecimals, value.ergPerToken, 0);
        tokenBalance.total.valueInErgs = this.multiplyFractions(tokenBalance.total.amount, tokenDecimals, value.ergPerToken, 0);
        // eslint-disable-next-line no-param-reassign
        tokenAmountsMap[value.token.tokenId].value = value;
    }
    async getTokenBalanceByAddress(address, numberOfTimesToRetry = this.defaultRetryCount, retryWaitTime = this.defaultRetryWaitMillis) {
        const balances = await this.explorerHttpClient.requestWithRetries({
            url: `/api/v1/addresses/${address}/balance/total`,
            transformResponse: (data) => JSONBI.parse(data),
        }, numberOfTimesToRetry, retryWaitTime);
        if (balances === undefined)
            return undefined; // Failed to retrieve values, we got nothin to give back.
        const tokenAmountsMap = {};
        balances.confirmed.tokens.forEach((token) => {
            tokenAmountsMap[token.tokenId] = {
                token,
                confirmed: {
                    amount: token.amount,
                },
                unconfirmed: { amount: 0 },
                total: {
                    amount: token.amount,
                },
            };
        });
        balances.unconfirmed.tokens.forEach((token) => {
            const curToken = tokenAmountsMap[token.tokenId] || { token, confirmed: { amount: 0 }, total: { amount: 0 } };
            curToken.unconfirmed = { amount: token.amount };
            curToken.confirmed = curToken.confirmed || { token, amount: 0 };
            curToken.total.amount = curToken.confirmed.amount + curToken.unconfirmed.amount;
        });
        const tokenSwapValues = await this.getTokenRates();
        tokenSwapValues?.forEach((value) => this.decorateTokenAmountsWithValues(value, tokenAmountsMap));
        return tokenAmountsMap;
    }
    async getTokenInfoById(tokenId, numberOfTimesToRetry = this.defaultRetryCount, retryWaitTime = this.defaultRetryWaitMillis) {
        const token = await this.explorerHttpClient.requestWithRetries({
            url: `/api/v1/tokens/${tokenId}`,
            params: { limit: 100, offset: 0 },
            transformResponse: (data) => JSONBI.parse(data),
        }, numberOfTimesToRetry, retryWaitTime);
        if (token === undefined)
            return undefined; // Failed to retrieve values, we got nothin to give back.
        return token;
    }
    async getSwappableTokens() {
        return (await this.getTokenRates()).map((swapValue) => swapValue.token);
    }
    async getTokenRateFor(tokenIds) {
        const tokenRates = await this.getTokenRates();
        return tokenRates.filter((rate) => tokenIds.includes(rate.token.tokenId));
    }
}
exports.ExplorerTokenMarket = ExplorerTokenMarket;
//# sourceMappingURL=ExplorerTokenMarket.js.map