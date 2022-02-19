import { AxiosRequestConfig } from 'axios';
import JSONBigInt from 'json-bigint';
import moment from 'moment';
import { ExplorerRequestManager } from './ExplorerRequestManager';
import { IAssetBalance, ITotalBalance } from './interfaces/explorer/IBalance';
import { IBox } from './interfaces/explorer/IBox';
import { IAddressTokenAmounts } from './interfaces/IAddressTokenAmounts';
import { ITokenInfo } from './interfaces/ITokenInfo';
import { ITokenMarket } from './interfaces/ITokenMarket';
import { ITokenRate } from './interfaces/ITokenRate';
import { math, renderFractions } from './math';

const PoolSample =
  '1999030f0400040204020404040405feffffffffffffffff0105feffffffffffffffff01050004d00f040004000406050005000580dac409d819d601b2a5730000d602e4c6a70404d603db63087201d604db6308a7d605b27203730100d606b27204730200d607b27203730300d608b27204730400d6099973058c720602d60a999973068c7205027209d60bc17201d60cc1a7d60d99720b720cd60e91720d7307d60f8c720802d6107e720f06d6117e720d06d612998c720702720fd6137e720c06d6147308d6157e721206d6167e720a06d6177e720906d6189c72117217d6199c72157217d1ededededededed93c27201c2a793e4c672010404720293b27203730900b27204730a00938c7205018c720601938c7207018c72080193b17203730b9593720a730c95720e929c9c721072117e7202069c7ef07212069a9c72137e7214067e9c720d7e72020506929c9c721372157e7202069c7ef0720d069a9c72107e7214067e9c72127e7202050695ed720e917212730d907216a19d721872139d72197210ed9272189c721672139272199c7216721091720b730e';
const JSONBI = JSONBigInt({ useNativeBigInt: true });

export const tokenSwapValueFromBox = (box: IBox, timestamp = moment.utc().valueOf()): ITokenRate => {
  const erg = { name: 'ERG', decimals: 9, amount: box.value };
  const token = box.assets[2];

  const ergAmount = renderFractions(box.value, 9);
  const tokenAmount = renderFractions(token.amount, token.decimals);
  const ergPerToken = math.evaluate?.(`${ergAmount} / ${tokenAmount}`).toFixed(erg.decimals ?? 0);
  const tokenPerErg = math.evaluate?.(`${tokenAmount} / ${ergAmount}`).toFixed(token.decimals ?? 0);
  const tokenInfo: ITokenInfo = {
    name: token.name,
    tokenId: token.tokenId,
    decimals: token.decimals,
  };
  return {
    timestamp, // numerical timestamp
    ergPerToken,
    tokenPerErg,
    ergAmount,
    tokenAmount,
    token: tokenInfo,
    globalIndex: box.globalIndex
  };
};

export type ExplorerTokenMarketConfig = {
  explorerUri?: string;
  defaultRetryCount?: number;
  defaultRetryWaitMillis?: number;
  throwOnError?: boolean;
  axiosInstanceConfig?: AxiosRequestConfig;
};

export class ExplorerTokenMarket implements ITokenMarket {
  private explorerHttpClient: ExplorerRequestManager;

  private explorerUri = 'https://api.ergoplatform.com';

  private defaultRetryCount = 5;

  private defaultRetryWaitMillis = 2000;

  private throwOnError = true;

  constructor(
    {
      explorerUri = 'https://api.ergoplatform.com',
      defaultRetryCount = 5,
      defaultRetryWaitMillis = 2000,
      throwOnError = true,
      axiosInstanceConfig = {},
    }: ExplorerTokenMarketConfig = {
      explorerUri: 'https://api.ergoplatform.com',
      defaultRetryCount: 5,
      defaultRetryWaitMillis: 2000,
      throwOnError: true,
      axiosInstanceConfig: {},
    }
  ) {
    this.explorerUri = explorerUri;
    this.defaultRetryCount = defaultRetryCount;
    this.defaultRetryWaitMillis = defaultRetryWaitMillis;
    this.throwOnError = throwOnError;

    this.explorerHttpClient = new ExplorerRequestManager(this.explorerUri, this.throwOnError, axiosInstanceConfig);
  }

  async getTransactionTimestamp(transactionId: string,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<number | undefined> {
    const transaction = await this.explorerHttpClient.requestWithRetries<{ timestamp: number }>(
      {
        url: `/api/v1/transactions/${transactionId}`,
        params: { },
        transformResponse: (data) => JSONBI.parse(data),
      },
      numberOfTimesToRetry,
      retryWaitTime
    );
    return transaction?.timestamp;
  }

  async getHistoricalTokenRates(
    numberToRetrieve: number = 500,
    initialOffset = 0,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis,
  ): Promise<ITokenRate[]> {
    let boxItems: IBox[] = [];
    for(let numberLeftToRetrieve = numberToRetrieve; numberLeftToRetrieve > 0;){
      const nextBoxItems = await this.explorerHttpClient.requestWithRetries<{ items: IBox[] }>(
        {
          url: `/api/v1/boxes/byErgoTree/${PoolSample}`,
          params: { limit: Math.min(500, numberLeftToRetrieve), offset: initialOffset + (numberToRetrieve - numberLeftToRetrieve) },
          transformResponse: (data) => JSONBI.parse(data),
        },
        numberOfTimesToRetry,
        retryWaitTime
      );
      if (nextBoxItems === undefined || nextBoxItems.items.length < 1) break;
      boxItems = boxItems.concat(nextBoxItems?.items);
      numberLeftToRetrieve -= Math.min(500, numberLeftToRetrieve);
    }

    if (boxItems === undefined) return []; // Failed to retrieve values, we got nothin to give back.

    const tokenRatesOverTime: ITokenRate[] = [];
    for(let boxItemChunk = 0; boxItemChunk < boxItems.length; boxItemChunk += 100) {
      await Promise.all(new Array(100).fill(0).map(async (blank, index) => {
        const boxItemIndex = boxItemChunk + index;
        if (boxItemIndex >= boxItems.length) return;
        const currentBox = boxItems[boxItemIndex];
        const boxCreationTimestamp = await this.getTransactionTimestamp(currentBox.transactionId);
        tokenRatesOverTime.push(tokenSwapValueFromBox(currentBox, boxCreationTimestamp))
      }))
    }
    return tokenRatesOverTime.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
  }

  async getTokenRates(
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<ITokenRate[]> {
    const boxItems = await this.explorerHttpClient.requestWithRetries<{ items: IBox[] }>(
      {
        url: `/api/v1/boxes/unspent/byErgoTree/${PoolSample}`,
        params: { limit: 100, offset: 0 },
        transformResponse: (data) => JSONBI.parse(data),
      },
      numberOfTimesToRetry,
      retryWaitTime
    );

    if (boxItems === undefined) return []; // Failed to retrieve values, we got nothin to give back.

    // Deduplicating the tokens because only the first box per token presents an accurate valuation with the dex
    return Object.values(
      boxItems.items.reduce((acc: any, box) => {
        const { tokenId } = box.assets[2];
        if (acc[tokenId] === undefined) acc[tokenId] = tokenSwapValueFromBox(box);
        return acc;
      }, {})
    );
  }

  multiplyFractions(amountA: number, decimalsA: number, amountB: number, decimalsB: number) {
    const amountAFraction = renderFractions(amountA, decimalsA);
    const amountBFraction = renderFractions(amountB, decimalsB);
    return math.evaluate?.(`${amountAFraction} * ${amountBFraction}`).toFixed();
  }

  decorateTokenAmountsWithValues(value: ITokenRate, tokenAmountsMap: IAddressTokenAmounts) {
    const tokenBalance = tokenAmountsMap[value.token.tokenId];
    if (tokenBalance === undefined) return; // they don't have this token in their wallet
    const {
      token: { decimals: tokenDecimals },
    } = value;

    tokenBalance.confirmed.valueInErgs = this.multiplyFractions(
      tokenBalance.confirmed.amount,
      tokenDecimals,
      value.ergPerToken,
      0
    );
    tokenBalance.unconfirmed.valueInErgs = this.multiplyFractions(
      tokenBalance.unconfirmed.amount,
      tokenDecimals,
      value.ergPerToken,
      0
    );
    tokenBalance.total.valueInErgs = this.multiplyFractions(
      tokenBalance.total.amount,
      tokenDecimals,
      value.ergPerToken,
      0
    );

    // eslint-disable-next-line no-param-reassign
    tokenAmountsMap[value.token.tokenId].value = value;
  }

  async getTokenBalanceByAddress(
    address: string,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<IAddressTokenAmounts | undefined> {
    const balances = await this.explorerHttpClient.requestWithRetries<ITotalBalance>(
      {
        url: `/api/v1/addresses/${address}/balance/total`,
        transformResponse: (data) => JSONBI.parse(data),
      },
      numberOfTimesToRetry,
      retryWaitTime
    );

    if (balances === undefined) return undefined; // Failed to retrieve values, we got nothin to give back.

    const tokenAmountsMap: IAddressTokenAmounts = {};
    balances.confirmed.tokens.forEach((token: IAssetBalance) => {
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
    balances.unconfirmed.tokens.forEach((token: IAssetBalance) => {
      const curToken = tokenAmountsMap[token.tokenId] || { token, confirmed: { amount: 0 }, total: { amount: 0 } };
      curToken.unconfirmed = { amount: token.amount };
      curToken.confirmed = curToken.confirmed || { token, amount: 0 };
      curToken.total.amount = curToken.confirmed.amount + curToken.unconfirmed.amount;
    });

    const tokenSwapValues = await this.getTokenRates();
    tokenSwapValues?.forEach((value) => this.decorateTokenAmountsWithValues(value, tokenAmountsMap));

    return tokenAmountsMap;
  }

  async getTokenInfoById(
    tokenId: string,
    numberOfTimesToRetry = this.defaultRetryCount,
    retryWaitTime: number = this.defaultRetryWaitMillis
  ): Promise<ITokenInfo> {
    const token = await this.explorerHttpClient.requestWithRetries<{ items: IBox[] }>(
      {
        url: `/api/v1/tokens/${tokenId}`,
        params: { limit: 100, offset: 0 },
        transformResponse: (data) => JSONBI.parse(data),
      },
      numberOfTimesToRetry,
      retryWaitTime
    );

    if (token === undefined) return undefined as any; // Failed to retrieve values, we got nothin to give back.

    return token as any;
  }

  async getSwappableTokens(): Promise<ITokenInfo[]> {
    return (await this.getTokenRates()).map((swapValue) => swapValue.token);
  }

  async getTokenRateFor(tokenIds: string[]): Promise<ITokenRate[]> {
    const tokenRates = await this.getTokenRates();
    return tokenRates.filter((rate) => tokenIds.includes(rate.token.tokenId));
  }
}
