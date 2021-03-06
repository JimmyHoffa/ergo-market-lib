"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerTokenMarket = exports.tokenSwapValueFromBox = exports.PoolSample = void 0;
const json_bigint_1 = __importDefault(require("json-bigint"));
const math_1 = require("./math");
const ProducerConsumerActionQueue_1 = require("./ProducerConsumerActionQueue");
const QueueingExplorerRequestManager_1 = require("./QueueingExplorerRequestManager");
exports.PoolSample = '1999030f0400040204020404040405feffffffffffffffff0105feffffffffffffffff01050004d00f040004000406050005000580dac409d819d601b2a5730000d602e4c6a70404d603db63087201d604db6308a7d605b27203730100d606b27204730200d607b27203730300d608b27204730400d6099973058c720602d60a999973068c7205027209d60bc17201d60cc1a7d60d99720b720cd60e91720d7307d60f8c720802d6107e720f06d6117e720d06d612998c720702720fd6137e720c06d6147308d6157e721206d6167e720a06d6177e720906d6189c72117217d6199c72157217d1ededededededed93c27201c2a793e4c672010404720293b27203730900b27204730a00938c7205018c720601938c7207018c72080193b17203730b9593720a730c95720e929c9c721072117e7202069c7ef07212069a9c72137e7214067e9c720d7e72020506929c9c721372157e7202069c7ef0720d069a9c72107e7214067e9c72127e7202050695ed720e917212730d907216a19d721872139d72197210ed9272189c721672139272199c7216721091720b730e';
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
        timestamp: box.createdAt,
        ergPerToken,
        tokenPerErg,
        ergAmount,
        tokenAmount,
        token: tokenInfo,
        globalIndex: box.globalIndex,
    };
};
exports.tokenSwapValueFromBox = tokenSwapValueFromBox;
class ExplorerTokenMarket {
    // private explorerHttpClient: ExplorerRequestManager;
    explorerHttpClient;
    requestsActionQueue;
    constructor(explorerRequestConfig) {
        this.requestsActionQueue = new ProducerConsumerActionQueue_1.ProducerConsumerActionQueue(10, 500);
        this.explorerHttpClient = new QueueingExplorerRequestManager_1.QueueingExplorerRequestManager(this.requestsActionQueue, explorerRequestConfig);
    }
    async getTransactionTimestamp(transactionId) {
        const transaction = await this.explorerHttpClient.requestWithRetries({
            url: `/api/v1/transactions/${transactionId}`,
            params: {},
            transformResponse: (data) => JSONBI.parse(data),
        });
        return transaction?.timestamp;
    }
    async getBoxesAtUri(uriForBoxes, numberToRetrieve = 500, initialOffset = 0) {
        const requestsToMake = [];
        for (let numberLeftToRetrieve = numberToRetrieve; numberLeftToRetrieve > 0;) {
            requestsToMake.push({
                url: uriForBoxes,
                params: {
                    limit: Math.min(500, numberLeftToRetrieve),
                    offset: initialOffset + (numberToRetrieve - numberLeftToRetrieve),
                },
                transformResponse: (data) => JSONBI.parse(data),
            });
            numberLeftToRetrieve -= Math.min(500, numberLeftToRetrieve);
        }
        const boxPages = await this.makeChunkedRequests(requestsToMake);
        if (boxPages === undefined)
            return []; // Failed to retrieve values, we got nothin to give back.
        return boxPages.flatMap((b) => b?.items || []);
    }
    async getTotalBoxCount(uriForBoxes) {
        const boxPage = await this.explorerHttpClient.requestWithRetries({
            url: uriForBoxes,
            params: { limit: 1 },
        });
        return boxPage?.total;
    }
    async getUniqueBoxesAtUri(uriForBoxes, uniqueBoxesDesired = 500, initialOffset = 0) {
        const totalBoxCount = await this.getTotalBoxCount(uriForBoxes);
        const uniqueBoxIds = new Set();
        const uniqueBoxes = {};
        const uniqueBoxItemsToGet = Math.min(totalBoxCount, uniqueBoxesDesired);
        let offset = initialOffset;
        do {
            const boxItems = await this.getBoxesAtUri(uriForBoxes, uniqueBoxesDesired, offset % totalBoxCount);
            offset += uniqueBoxesDesired;
            if (boxItems.length === 0)
                return []; // Failed to retrieve values, we got nothin to give back.
            boxItems.forEach((cur) => {
                uniqueBoxes[cur.boxId] = cur;
                uniqueBoxIds.add(cur.boxId);
            });
        } while (uniqueBoxIds.size < uniqueBoxItemsToGet);
        return Array.from(uniqueBoxIds).map((boxId) => uniqueBoxes[boxId]);
    }
    async makeChunkedRequests(requestConfigs) {
        return Promise.all(requestConfigs.map((cfg) => this.explorerHttpClient.requestWithRetries(cfg)));
    }
    async getTimestampsForBoxes(boxesWithoutCreationDates) {
        const transactionRequests = boxesWithoutCreationDates.map((box) => ({
            url: `/api/v1/transactions/${box.transactionId}`,
            params: {},
            transformResponse: (data) => {
                const tx = JSONBI.parse(data);
                box.createdAt = tx.timestamp;
                return box;
            },
        }));
        // const boxesOverTime = await Promise.all<ITimestampedBox>(
        //   transactionRequests.map((cfg) => this.explorerHttpClient.requestWithRetries<ITimestampedBox>(cfg) as any)
        // );
        const boxesOverTime = await this.makeChunkedRequests(transactionRequests);
        return boxesOverTime.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    }
    async getTimestampedBoxesFromBoxes(boxesToTimestamp) {
        const boxesWithCreationDatesRequest = boxesToTimestamp.map((box) => ({
            url: `/api/v1/transactions/${box.transactionId}`,
            params: {},
            transformResponse: (data) => {
                const tx = JSONBI.parse(data);
                box.createdAt = tx.timestamp;
                return box;
            },
        }));
        const boxesWithSpendDatesRequest = boxesToTimestamp
            .filter((box) => box.spentTransactionId?.length)
            .map((box) => ({
            url: `/api/v1/transactions/${box.spentTransactionId}`,
            params: {},
            transformResponse: (data) => {
                const tx = JSONBI.parse(data);
                box.spentAt = tx.timestamp;
                return box;
            },
        }));
        const boxesWithCreation = (await this.makeChunkedRequests(boxesWithCreationDatesRequest)).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        await this.makeChunkedRequests(boxesWithSpendDatesRequest); // Adds spentAt to boxes in the transform response defined above
        return boxesWithCreation;
    }
    async getBalanceTimelineAtAddress(address, numberToRetrieve = 500) {
        const allBoxesForAddress = await this.getUniqueBoxesAtUri(`/api/v1/boxes/byAddress/${address}`, numberToRetrieve);
        const timestampedBoxes = await this.getTimestampedBoxesFromBoxes(allBoxesForAddress);
        const creditBoxToBalance = (boxToDebit, tokenBalances) => {
            tokenBalances.nergs = tokenBalances.nergs || 0;
            tokenBalances.nergs += boxToDebit.value || 0;
            boxToDebit.assets.forEach((assetToDebit) => {
                tokenBalances[assetToDebit.tokenId] = tokenBalances[assetToDebit.tokenId] || 0;
                tokenBalances[assetToDebit.tokenId] += assetToDebit.amount;
            });
            return tokenBalances;
        };
        const debitBoxFromBalance = (boxToDebit, tokenBalances) => {
            tokenBalances.nergs = tokenBalances.nergs || 0;
            tokenBalances.nergs -= boxToDebit.value || 0;
            boxToDebit.assets.forEach((assetToDebit) => {
                tokenBalances[assetToDebit.tokenId] = tokenBalances[assetToDebit.tokenId] || 0;
                tokenBalances[assetToDebit.tokenId] -= assetToDebit.amount;
            });
            return tokenBalances;
        };
        let balancesOverTime = [];
        timestampedBoxes.forEach((box) => {
            const tokenBalances = {};
            creditBoxToBalance(box, tokenBalances);
            balancesOverTime.push({ tokenBalances: {}, timestamp: box.createdAt, box });
            if (box.spentAt)
                balancesOverTime.push({ tokenBalances: {}, timestamp: box?.spentAt, box });
        });
        timestampedBoxes.forEach((box) => {
            const creditBegins = box.createdAt;
            const creditEnds = box.spentAt || Number.MAX_SAFE_INTEGER;
            balancesOverTime.forEach((boxToCreditOrDebit) => {
                if (boxToCreditOrDebit.timestamp >= creditBegins) {
                    creditBoxToBalance(box, boxToCreditOrDebit.tokenBalances);
                }
                if (boxToCreditOrDebit.timestamp >= creditEnds) {
                    debitBoxFromBalance(box, boxToCreditOrDebit.tokenBalances);
                }
            });
        });
        balancesOverTime = balancesOverTime.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
        return balancesOverTime;
    }
    async getHistoricalTokenRates(numberToRetrieve = 500) {
        const result = [];
        let offset = 0;
        let numberLeftToRetrieve = numberToRetrieve;
        while (result.length < numberToRetrieve) {
            const ergoPoolBoxes = await this.getUniqueBoxesAtUri(`/api/v1/boxes/byErgoTree/${exports.PoolSample}`, numberLeftToRetrieve, offset);
            if (ergoPoolBoxes.length < 1)
                return []; // We couldn't get anything
            offset += numberLeftToRetrieve;
            const timestampedBoxes = await this.getTimestampsForBoxes(ergoPoolBoxes);
            const tokenRates = timestampedBoxes.map(exports.tokenSwapValueFromBox);
            tokenRates.reduce((acc, tokenRate) => {
                const { token: { tokenId }, } = tokenRate;
                if (acc[tokenId] === undefined)
                    acc[tokenId] = tokenRate;
                if (parseFloat(acc[tokenId].ergAmount) > parseFloat(math_1.math.evaluate?.(`${tokenRate.ergAmount} / 3`) || '0')) {
                    acc[tokenId] = tokenRate;
                    result.push(tokenRate);
                }
                return acc;
            }, {});
            numberLeftToRetrieve = numberToRetrieve - result.length;
        }
        return result;
    }
    async getTokenRates() {
        const boxItems = await this.explorerHttpClient.requestWithRetries({
            url: `/api/v1/boxes/unspent/byErgoTree/${exports.PoolSample}`,
            params: { limit: 100, offset: 0 },
            transformResponse: (data) => JSONBI.parse(data),
        });
        const timestampedBoxes = await this.getTimestampedBoxesFromBoxes(boxItems?.items || []);
        if (boxItems === undefined)
            return []; // Failed to retrieve values, we got nothin to give back.
        // Finding the largest erg box as that's the correct swap pool
        return Object.values(timestampedBoxes.reduce((acc, box) => {
            const { tokenId } = box.assets[2];
            const tokenRateFromBox = (0, exports.tokenSwapValueFromBox)(box);
            if (acc[tokenId] === undefined)
                acc[tokenId] = tokenRateFromBox;
            if (acc[tokenId].ergAmount < tokenRateFromBox.ergAmount)
                acc[tokenId] = tokenRateFromBox;
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
    async getTokenBalanceByAddress(address, tokenSwapValues = []) {
        const balances = await this.explorerHttpClient.requestWithRetries({
            url: `/api/v1/addresses/${address}/balance/total`,
            transformResponse: (data) => JSONBI.parse(data),
        });
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
        if (tokenSwapValues.length < 1)
            tokenSwapValues = await this.getTokenRates();
        tokenSwapValues?.forEach((value) => this.decorateTokenAmountsWithValues(value, tokenAmountsMap));
        return tokenAmountsMap;
    }
    async getTokenInfoById(tokenId) {
        const token = await this.explorerHttpClient.requestWithRetries({
            url: `/api/v1/tokens/${tokenId}`,
            params: { limit: 100, offset: 0 },
            transformResponse: (data) => JSONBI.parse(data),
        });
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